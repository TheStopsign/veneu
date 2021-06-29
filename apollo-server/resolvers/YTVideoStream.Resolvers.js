const { AuthenticationError, ForbiddenError } = require("apollo-server-express");

const eventName = {
  YTVIDEOSTREAM_CREATED: "YTVIDEOSTREAM_CREATED",
  YTVIDEOSTREAM_UPDATED: "YTVIDEOSTREAM_UPDATED",
  YTVIDEOSTREAM_DELETED: "YTVIDEOSTREAM_DELETED",
};

module.exports = {
  Query: {
    YTVideoStream: (parent, { _id }, { requester, models: { YTVideoStream } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return YTVideoStream.findById({ _id: _id });
    },
    YTVideoStreams: (parent, args, { requester, models: { YTVideoStream } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return YTVideoStream.find();
    },
  },
  Mutation: {
    createYTVideoStream: (
      parent,
      { url, name, parent_resource, parent_resource_type, duration, assignment, hidden_until, due, points, checkins },
      { requester, models: { YTVideoStream, Assignment } },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return YTVideoStream.create({
        url,
        name,
        parent_resource,
        parent_resource_type,
        creator: requester._id,
        duration,
        checkins,
      }).then((ytVideoStream) => {
        if (assignment) {
          return Assignment.create({
            assignable: ytVideoStream._id,
            assignable_type: "YTVideoStream",
            hidden_until,
            due,
            points,
          }).then((assignment) => {
            return ytVideoStream;
          });
        } else {
          return ytVideoStream;
        }
      });
    },
    deleteYTVideoStream: (parent, { _id }, { requester, models: { YTVideoStream } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return YTVideoStream.findOne({ _id })
        .then((ytVideoStream) => ytVideoStream.deleteOne())
        .then((ytVideoStream) => {
          return global.pubsub
            .publish(eventName.YTVIDEOSTREAM_DELETED, { ytVideoStreamDeleted: ytVideoStream })
            .then((done) => {
              return ytVideoStream;
            });
        });
    },
  },
  Subscription: {
    YTVideoStreamCreated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.YTVIDEOSTREAM_CREATED]),
    },
    YTVideoStreamUpdated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.YTVIDEOSTREAM_UPDATED]),
    },
    YTVideoStreamDeleted: {
      subscribe: () => global.pubsub.asyncIterator([eventName.YTVIDEOSTREAM_DELETED]),
    },
  },
  YTVideoStream: {
    assignment: (parent, args, { loaders: { Assignment } }, info) => Assignment.load(parent.assignment),
  },
};

const { AuthenticationError, ForbiddenError } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");

const eventName = {
  YTVIDEOSTREAM_CREATED: "YTVIDEOSTREAM_CREATED",
  YTVIDEOSTREAM_UPDATED: "YTVIDEOSTREAM_UPDATED",
  YTVIDEOSTREAM_DELETED: "YTVIDEOSTREAM_DELETED",
};

module.exports = {
  Query: {
    YTVideoStream: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne({ _id, type: "YTVideoStream" }, { requester, models, loaders, pubsub });
    },
    YTVideoStreams: (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readMany(
        { auths: { $in: requester.auths.map((a) => a._id) }, type: "YTVideoStream" },
        { requester, models, loaders, pubsub }
      );
    },
  },
  Mutation: {
    createYTVideoStream: (
      parent,
      { url, name, parent_resource, parent_resource_type, duration, assignment, hidden_until, due, points, checkins },
      { requester, models, loaders, pubsub },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return createOne(
        {
          url,
          name,
          parent_resource,
          parent_resource_type,
          creator: requester._id,
          duration,
          checkins,
          type: "YTVideoStream",
        },
        { requester, models, loaders, pubsub }
      ).then((ytVideoStream) => {
        if (assignment) {
          return createOne(
            {
              assignable: ytVideoStream._id,
              assignable_type: "YTVideoStream",
              hidden_until,
              due,
              points,
              type: "Assignment",
            },
            { requester, models, loaders, pubsub }
          ).then((assignment) => ytVideoStream);
        } else {
          return ytVideoStream;
        }
      });
    },
    deleteYTVideoStream: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return deleteOne({ _id, type: "YTVideoStream" }, { requester, models, loaders, pubsub });
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
    assignment: (parent, args, { loaders: { Assignment } }, info) =>
      parent.assignment ? Assignment.load(parent.assignment) : null,
    checkins: (parent, args, { loaders: { Checkin } }, info) =>
      parent.checkins ? Checkin.loadMany(parent.checkins) : [],
  },
};

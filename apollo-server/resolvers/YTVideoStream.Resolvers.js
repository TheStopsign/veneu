const { ForbiddenError } = require("apollo-server-express");
const { crudFunnel } = require("../crudHandlers");

const eventName = {
  YTVIDEOSTREAM_CREATED: "YTVIDEOSTREAM_CREATED",
  YTVIDEOSTREAM_UPDATED: "YTVIDEOSTREAM_UPDATED",
  YTVIDEOSTREAM_DELETED: "YTVIDEOSTREAM_DELETED",
};

module.exports = (pubsub, caches) => ({
  Query: {
    YTVideoStream: (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("YTVideoStream", "findOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
    YTVideoStreams: (parent, args, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      let ids = requester.auths.filter((a) => a.shared_resource_type == "YTVideoStream").map((a) => a._id);
      return crudFunnel("YTVideoStream", "find", { _id: { $in: ids } }, ids, {
        models,
        loaders,
        pubsub,
        caches,
      });
    },
  },
  Mutation: {
    createYTVideoStream: (
      parent,
      { url, name, parent_resource, parent_resource_type, duration, assignment, hidden_until, due, points, checkins },
      { requester, models, loaders, pubsub, caches },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel(
        "YTVideoStream",
        "create",
        {
          url,
          name,
          parent_resource,
          parent_resource_type,
          creator: requester._id,
          duration,
          checkins,
        },
        null,
        { models, loaders, pubsub, caches }
      ).then((ytVideoStream) => {
        if (assignment) {
          return crudFunnel(
            "Assignment",
            "create",
            {
              assignable: ytVideoStream._id,
              assignable_type: "YTVideoStream",
              hidden_until,
              due,
              points,
              creator: requester._id,
              name,
              parent_resource: ytVideoStream._id,
              parent_resource_type: ytVideoStream.type,
            },
            null,
            { models, loaders, pubsub, caches }
          ).then((assignment) => ytVideoStream);
        } else {
          return ytVideoStream;
        }
      });
    },
    deleteYTVideoStream: (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("YTVideoStream", "deleteOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
  },
  Subscription: {
    YTVideoStreamCreated: {
      subscribe: () => pubsub.asyncIterator([eventName.YTVIDEOSTREAM_CREATED]),
    },
    YTVideoStreamUpdated: {
      subscribe: () => pubsub.asyncIterator([eventName.YTVIDEOSTREAM_UPDATED]),
    },
    YTVideoStreamDeleted: {
      subscribe: () => pubsub.asyncIterator([eventName.YTVIDEOSTREAM_DELETED]),
    },
  },
  YTVideoStream: {
    assignment: (parent, args, { models, loaders, pubsub, caches }, info) =>
      parent.assignment
        ? crudFunnel("Assignment", "findOne", { _id: parent.assignment }, parent.assignment, {
            models,
            loaders,
            pubsub,
            caches,
          })
        : null,
    checkins: (parent, args, { models, loaders, pubsub, caches }, info) =>
      parent.checkins
        ? crudFunnel("Checkin", "find", { _id: { $in: parent.checkins } }, parent.checkins, {
            models,
            loaders,
            pubsub,
            caches,
          })
        : [],
  },
});

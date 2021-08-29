const { AuthenticationError, ForbiddenError } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");

const eventName = {
  NOTIFICATION_CREATED: "NOTIFICATION_CREATED",
  NOTIFICATION_UPDATED: "NOTIFICATION_UPDATED",
  NOTIFICATION_DELETED: "NOTIFICATION_DELETED",
};

module.exports = (pubsub) => ({
  Query: {
    notification: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne({ _id, type: "Notification" }, { requester, models, loaders, pubsub });
    },
    notifications: (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readMany({ type: "Notification" }, { requester, models, loaders, pubsub });
    },
  },
  Mutation: {
    createNotification: (parent, { text, redirect, user }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return createOne(
        {
          text,
          redirect,
          user,
          type: "Notification",
        },
        { requester, models, loaders, pubsub }
      );
    },
    updateNotification(parent, { _id, ...patch }, { requester, models, loaders, pubsub }, info) {
      if (!requester || requester._id != _id) throw new ForbiddenError("Not allowed");
      return updateOne({ _id, type: "Notification" }, patch, { requester, models, loaders, pubsub });
    },
    deleteNotification: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester || requester._id != _id) throw new ForbiddenError("Not allowed");
      return deleteOne({ _id, type: "Notification" }, { requester, models, loaders, pubsub });
    },
  },
  Subscription: {
    notificationCreated: {
      subscribe: () => pubsub.asyncIterator([eventName.NOTIFICATION_CREATED]),
    },
    notificationUpdated: {
      subscribe: () => pubsub.asyncIterator([eventName.NOTIFICATION_UPDATED]),
    },
    notificationDeleted: {
      subscribe: () => pubsub.asyncIterator([eventName.NOTIFICATION_DELETED]),
    },
  },
  Notification: {
    user: (parent, args, { loaders: { User } }, info) => User.load(parent.user),
  },
});

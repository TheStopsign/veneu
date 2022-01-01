const { ForbiddenError } = require("apollo-server-express");
const { crudFunnel } = require("../crudHandlers");

const eventName = {
  NOTIFICATION_CREATED: "NOTIFICATION_CREATED",
  NOTIFICATION_UPDATED: "NOTIFICATION_UPDATED",
  NOTIFICATION_DELETED: "NOTIFICATION_DELETED",
};

module.exports = (pubsub, caches) => ({
  Query: {
    notification: (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("Notification", "findOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
    notifications: (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("Notification", "find", { _id: { $in: requester.notifications } }, requester.notifications, {
        models,
        loaders,
        pubsub,
        caches,
      });
    },
  },
  Mutation: {
    createNotification: (parent, { text, redirect, user }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel(
        "Notification",
        "create",
        {
          text,
          redirect,
          user,
        },
        null,
        { models, loaders, pubsub, caches }
      );
    },
    updateNotification(parent, { _id, ...patch }, { requester, models, loaders, pubsub, caches }, info) {
      if (!requester || requester._id != _id) throw new ForbiddenError("Not allowed");
      return crudFunnel("Notification", "updateOne", [{ _id }, patch], _id, { models, loaders, pubsub, caches });
    },
    deleteNotification: (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester || requester._id != _id) throw new ForbiddenError("Not allowed");
      return crudFunnel("Notification", "deleteOne", { _id }, _id, { models, loaders, pubsub, caches });
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
    user: (parent, args, { models, loaders, pubsub, caches }, info) =>
      crudFunnel("User", "findOne", { _id: parent.user }, parent.user, { models, loaders, pubsub, caches }),
  },
});

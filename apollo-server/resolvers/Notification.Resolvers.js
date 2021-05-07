const { AuthenticationError, ForbiddenError } = require("apollo-server-express");

const eventName = {
  NOTIFICATION_CREATED: "NOTIFICATION_CREATED",
  NOTIFICATION_UPDATED: "NOTIFICATION_UPDATED",
  NOTIFICATION_DELETED: "NOTIFICATION_DELETED"
};

module.exports = {
  Query: {
    notification: (parent, { _id }, { requester, models: { Notification } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Notification.findById({ _id });
    },
    notifications: (parent, args, { requester, models: { Notification } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Notification.find();
    }
  },
  Mutation: {
    createNotification: (parent, { text, redirect, user }, { requester, models: { Notification } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Notification.create({
        text,
        redirect,
        user
      }).then(notification => {
        return global.pubsub
          .publish(eventName.NOTIFICATION_CREATED, { notificationCreated: notification })
          .then(done => {
            return notification;
          });
      });
    },
    updateNotification(parent, { _id, ...patch }, { requester, models: { Notification } }, info) {
      if (!requester || requester._id != _id) throw new ForbiddenError("Not allowed");
      return Notification.findOneAndUpdate({ _id: _id }, patch, { new: true }).then(notification => {
        return global.pubsub
          .publish(eventName.NOTIFICATION_UPDATED, { notificationUpdated: notification })
          .then(done => {
            return notification;
          });
      });
    },
    deleteNotification: (parent, { _id }, { requester, models: { Notification } }, info) => {
      if (!requester || requester._id != _id) throw new ForbiddenError("Not allowed");
      return Notification.findOne({ _id })
        .then(notification => notification.deleteOne())
        .then(notification => {
          return global.pubsub
            .publish(eventName.NOTIFICATION_DELETED, { notificationDeleted: notification })
            .then(done => {
              return notification;
            });
        });
    }
  },
  Subscription: {
    notificationCreated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.NOTIFICATION_CREATED])
    },
    notificationUpdated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.NOTIFICATION_UPDATED])
    },
    notificationDeleted: {
      subscribe: () => global.pubsub.asyncIterator([eventName.NOTIFICATION_DELETED])
    }
  },
  Notification: {
    user: (parent, args, { models: { User } }, info) => {
      return User.findById({ _id: parent.user });
    }
  }
};

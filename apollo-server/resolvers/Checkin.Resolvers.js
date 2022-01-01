const { ForbiddenError, ValidationError } = require("apollo-server-express");
const { readOne, crudFunnel } = require("../crudHandlers");

const eventName = {
  CHECKIN_CREATED: "CHECKIN_CREATED",
  CHECKIN_UPDATED: "CHECKIN_UPDATED",
  CHECKIN_DELETED: "CHECKIN_DELETED",
};

module.exports = (pubsub, caches) => ({
  Query: {
    checkin: async (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel(
        "Checkin",
        "findOne",
        {
          _id,
        },
        _id,
        { models, loaders, pubsub, caches }
      );
    },
    checkins: async (parent, args, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      let ids = requester.auths.filter((a) => a.shared_resource_type == "Checkin").map((a) => a.shared_resource);
      return crudFunnel(
        "Checkin",
        "find",
        {
          _id: { $in: ids },
        },
        ids,
        { models, loaders, pubsub, caches }
      );
    },
    receipt: async (parent, { _id, email }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      if (
        requester.email != email &&
        !requester.auths.find(
          (a) => a.shared_resource._id == _id && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
        )
      )
        throw new ForbiddenError("Not allowed");
      return readOne({ checkin: _id, email, type: "Ticket" }, { requester, models, loaders, pubsub });
    },
  },
  Mutation: {
    createCheckin: async (parent, { ...options }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      if (options.ticketing_requires_authorization && !options.ticketing_requires_authentication) {
        throw new ValidationError("Authorization also requires Authentication");
      }
      return crudFunnel(
        "Checkin",
        "create",
        {
          creator: requester._id,
          parent_resource: requester._id,
          parent_resource_type: "User",
          ...options,
        },
        null,
        { models, loaders, pubsub, caches }
      );
    },
    deleteCheckin: async (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("Checkin", "deleteOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
  },
  Subscription: {
    checkinCreated: {
      subscribe: () => pubsub.asyncIterator([eventName.CHECKIN_CREATED]),
    },
    checkinDeleted: {
      subscribe: () => pubsub.asyncIterator([eventName.CHECKIN_DELETED]),
    },
  },
  Checkin: {
    tickets: async (parent, args, { models, loaders, pubsub, caches }, info) =>
      crudFunnel("Ticket", "find", { _id: { $in: parent.tickets } }, parent.tickets, {
        models,
        loaders,
        pubsub,
        caches,
      }),
  },
});

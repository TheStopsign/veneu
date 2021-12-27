const { ForbiddenError, withFilter, ValidationError } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");

const eventName = {
  CHECKIN_CREATED: "CHECKIN_CREATED",
  CHECKIN_UPDATED: "CHECKIN_UPDATED",
  CHECKIN_DELETED: "CHECKIN_DELETED",
};

module.exports = (pubsub) => ({
  Query: {
    checkin: async (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne({ _id, type: "Checkin" }, { requester, models, loaders, pubsub });
    },
    checkins: async (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readMany(
        {
          $or: [{ creator: requester._id }, { auths: { $in: requester.auths.map((a) => a._id) } }],
          type: "Checkin",
        },
        { requester, models, loaders, pubsub }
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
    createCheckin: async (parent, { ...options }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      if (options.ticketing_requires_authorization && !options.ticketing_requires_authentication) {
        throw new ValidationError("Authorization also requires Authentication");
      }
      return createOne(
        {
          creator: requester._id,
          parent_resource: requester._id,
          parent_resource_type: "User",
          type: "Checkin",
          ...options,
        },
        { requester, models, loaders, pubsub }
      );
    },
    deleteCheckin: async (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return deleteOne({ _id, type: "Checkin" }, { requester, models, loaders, pubsub });
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
    tickets: async (parent, args, { loaders: { Ticket } }, info) => Ticket.loadMany(parent.tickets),
  },
});

const { ForbiddenError, withFilter } = require("apollo-server-express");
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
      return readMany({ creator: requester._id, type: "Checkin" }), { requester, models, loaders, pubsub };
    },
  },
  Mutation: {
    createCheckin: async (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return createOne({ creator: requester._id, type: "Checkin" }, { requester, models, loaders, pubsub });
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

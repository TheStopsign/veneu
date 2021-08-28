const { PubSub, ForbiddenError, withFilter } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");

module.exports = {
  Query: {
    ticket: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne({ _id, type: "Ticket" }, { requester, models, loaders, pubsub });
    },
    tickets: (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readMany({ user: requester._id, type: "Ticket" }, { requester, models, loaders, pubsub });
    },
  },
  Mutation: {
    claimTicket: (parent, ticket, { requester, models, loaders, pubsub }, info) => {
      return pubsub.publish("CLAIMED_TICKET", { claimedTicket: { ticket } }).then((done) => ticket);
    },
    approveTicket: (parent, ticket, { requester, models, loaders, pubsub }, info) => {
      return createOne({ ...ticket, type: "Ticket" }, { requester, models, loaders, pubsub })
        .then((ticket) => pubsub.publish("APPROVED_TICKET", { approvedTicket: { ticket } }))
        .then((done) => ticket);
    },
    reserveTicket: (parent, { host, tickets }, { requester, models, loaders, pubsub }, info) => {
      return pubsub.publish("RESERVED_TICKET", { reservedTicket: { host, tickets } }).then((done) => tickets);
    },
  },
  Subscription: {
    claimedTicket: {
      subscribe: withFilter(
        () => global.pubsub.asyncIterator(["CLAIMED_TICKET"]),
        (
          {
            claimedTicket: {
              ticket: { code },
            },
          },
          variables
        ) => code == variables.code
      ),
      resolve: ({ claimedTicket: { ticket } }) => ticket,
    },
    approvedTicket: {
      subscribe: withFilter(
        () => global.pubsub.asyncIterator(["APPROVED_TICKET"]),
        (
          {
            approvedTicket: {
              ticket: { user },
            },
          },
          variables
        ) => user == variables.user
      ),
      resolve: ({ approvedTicket: { ticket } }) => ticket,
    },
    reservedTicket: {
      subscribe: withFilter(
        () => global.pubsub.asyncIterator(["RESERVED_TICKET"]),
        ({ reservedTicket: { host } }, variables) => host == variables.host
      ),
      resolve: ({ reservedTicket: { tickets } }) => tickets,
    },
  },
  Ticket: {
    checkin: (parent, args, { loaders: { Checkin } }, info) => Checkin.load(parent.checkin),
  },
};

const { ForbiddenError, withFilter } = require("apollo-server-express");
const { readMany, crudFunnel } = require("../crudHandlers");

module.exports = (pubsub, caches) => ({
  Query: {
    ticket: async (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("Ticket", "findOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
    tickets: async (parent, args, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readMany({ user: requester._id, type: "Ticket" }, { requester, models, loaders, pubsub, caches });
    },
  },
  Mutation: {
    claimTicket: async (parent, ticket, { requester, models, loaders, pubsub, caches }, info) => {
      let checkin = await crudFunnel("Checkin", "findOne", { _id: ticket.checkin }, ticket.checkin, {
        models,
        loaders,
        pubsub,
        caches,
      });
      if (checkin.ticketing_requires_authentication && !requester) {
        throw new ForbiddenError("Must be logged in to claim a Ticket from this Checkin");
      }
      if (checkin.ticketing_requires_authorization) {
        if (!requester) {
          throw new ForbiddenError("Must be logged in to claim a Ticket from this Checkin");
        }
        if (!requester.auths.find((a) => a.shared_resource == ticket.checkin)) {
          throw new ForbiddenError("Must be authorized to claim a Ticket from this Checkin");
        }
      }
      return pubsub.publish("CLAIMED_TICKET", { claimedTicket: { ticket } }).then((done) => ticket);
    },
    approveTicket: async (parent, ticket, { requester, models, loaders, pubsub, caches }, info) => {
      return crudFunnel("Ticket", "createOne", ticket, null, { models, loaders, pubsub, caches })
        .then((ticket) => pubsub.publish("APPROVED_TICKET", { approvedTicket: { ticket } }))
        .then((done) => ticket);
    },
    reserveTicket: async (parent, { checkin, tickets }, { requester, models, loaders, pubsub, caches }, info) => {
      return pubsub.publish("RESERVED_TICKET", { reservedTicket: { checkin, tickets } }).then((done) => tickets);
    },
  },
  Subscription: {
    claimedTicket: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(["CLAIMED_TICKET"]),
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
        () => pubsub.asyncIterator(["APPROVED_TICKET"]),
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
        () => pubsub.asyncIterator(["RESERVED_TICKET"]),
        ({ reservedTicket: { checkin } }, variables) => checkin == variables.checkin
      ),
      resolve: ({ reservedTicket: { tickets } }) => tickets,
    },
  },
  Ticket: {
    checkin: (parent, args, { requester, models, loaders, pubsub, caches }, info) =>
      crudFunnel("Checkin", "findOne", { _id: parent.checkin }, parent.checkin, { models, loaders, pubsub, caches }),
  },
});

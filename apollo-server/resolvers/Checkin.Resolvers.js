const { PubSub, ForbiddenError, withFilter } = require("apollo-server-express");

const { Types } = require("mongoose");

const eventName = {
  CHECKIN_CREATED: "CHECKIN_CREATED",
  CHECKIN_UPDATED: "CHECKIN_UPDATED",
  CHECKIN_DELETED: "CHECKIN_DELETED"
};

module.exports = {
  Query: {
    checkin: (parent, { _id }, { requester, models: { Checkin } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Checkin.findById({ _id: _id });
    },
    checkins: (parent, args, { requester, models: { Checkin } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Checkin.find({ creator: requester._id });
    }
  },
  Mutation: {
    createCheckin: (parent, args, { requester, models: { Checkin } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Checkin.create({ creator: requester._id }).then(checkin => {
        return global.pubsub.publish(eventName.CHECKIN_CREATED, { checkinCreated: checkin }).then(done => {
          return checkin;
        });
      });
    },
    deleteCheckin: (parent, { _id }, { requester, models: { Checkin } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Checkin.findOne({ _id })
        .then(checkin => checkin.deleteOne())
        .then(checkin => {
          return global.pubsub
            .publish(eventName.CHECKIN_DELETED, {
              checkinDeleted: checkin
            })
            .then(done => {
              return checkin;
            });
        });
    }
  },
  Subscription: {
    checkinCreated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.CHECKIN_CREATED])
    },
    checkinDeleted: {
      subscribe: () => global.pubsub.asyncIterator([eventName.CHECKIN_DELETED])
    }
  },
  Checkin: {
    tickets: (parent, args, { models: { Ticket } }, info) => {
      return Ticket.find({ checkin: parent._id }).then(tickets => {
        return tickets;
      });
    }
  }
};

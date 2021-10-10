const { ForbiddenError } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");

const eventName = {
  FREERESPONSE_CREATED: "FREERESPONSE_CREATED",
  FREERESPONSE_UPDATED: "FREERESPONSE_UPDATED",
  FREERESPONSE_DELETED: "FREERESPONSE_DELETED",
};

module.exports = (pubsub) => ({
  Query: {
    freeResponse: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne({ _id, creator: requester._id, type: "FreeResponse" }, { requester, models, loaders, pubsub });
    },
    freeResponses: (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readMany({ creator: requester._id, type: "FreeResponse" }, { requester, models, loaders, pubsub });
    },
  },
  Mutation: {
    createFreeResponse: (parent, { question }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return createOne(
        { question, creator: requester._id, type: "FreeResponse" },
        { requester, models, loaders, pubsub }
      );
    },
    //TODO updateFreeResponse
    //TODO deleteFreeResponse
  },
  Subscription: {
    freeResponseCreated: {
      subscribe: () => pubsub.asyncIterator([eventName.FREERESPONSE_CREATED]),
    },
    freeResponseUpdated: {
      subscribe: () => pubsub.asyncIterator([eventName.FREERESPONSE_UPDATED]),
    },
    freeResponseDeleted: {
      subscribe: () => pubsub.asyncIterator([eventName.FREERESPONSE_DELETED]),
    },
  },
});

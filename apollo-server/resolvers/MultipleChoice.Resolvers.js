const { ForbiddenError } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");

const eventName = {
  MULTIPLECHOICE_CREATED: "MULTIPLECHOICE_CREATED",
  MULTIPLECHOICE_UPDATED: "MULTIPLECHOICE_UPDATED",
  MULTIPLECHOICE_DELETED: "MULTIPLECHOICE_DELETED",
};

module.exports = (pubsub) => ({
  Query: {
    multipleChoice: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne({ _id, creator: requester._id, type: "MultipleChoice" }, { requester, models, loaders, pubsub });
    },
    multipleChoices: (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readMany({ creator: requester._id, type: "MultipleChoice" }, { requester, models, loaders, pubsub });
    },
  },
  Mutation: {
    createMultipleChoice: (parent, { question, choices }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return createOne(
        { question, choices, creator: requester._id, type: "MultipleChoice" },
        { requester, models, loaders, pubsub }
      );
    },
    //TODO updateMultipleChoice
    //TODO deleteMultipleChoice
  },
  Subscription: {
    multipleChoiceCreated: {
      subscribe: () => pubsub.asyncIterator([eventName.MULTIPLECHOICE_CREATED]),
    },
    multipleChoiceUpdated: {
      subscribe: () => pubsub.asyncIterator([eventName.MULTIPLECHOICE_UPDATED]),
    },
    multipleChoiceDeleted: {
      subscribe: () => pubsub.asyncIterator([eventName.MULTIPLECHOICE_DELETED]),
    },
  },
});

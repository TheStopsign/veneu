const { ForbiddenError } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");

const eventName = {
  ANSWER_CREATED: "ANSWER_CREATED",
  ANSWER_UPDATED: "ANSWER_UPDATED",
  ANSWER_DELETED: "ANSWER_DELETED",
};

module.exports = (pubsub) => ({
  Query: {
    answer: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne({ _id, creator: requester._id, type: "Answer" }, { requester, models, loaders, pubsub });
    },
    answers: (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readMany({ creator: requester._id, type: "Answer" }, { requester, models, loaders, pubsub });
    },
  },
  Mutation: {
    createAnswer: (parent, { question, question_type, answer }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return createOne(
        { question, question_type, answer, creator: requester._id, type: "Answer" },
        { requester, models, loaders, pubsub }
      );
    },
    //TODO updateAnswer
    //TODO deleteAnswer
  },
  Subscription: {
    answerCreated: {
      subscribe: () => pubsub.asyncIterator([eventName.ANSWER_CREATED]),
    },
    answerUpdated: {
      subscribe: () => pubsub.asyncIterator([eventName.ANSWER_UPDATED]),
    },
    answerDeleted: {
      subscribe: () => pubsub.asyncIterator([eventName.ANSWER_DELETED]),
    },
  },
});

const { ForbiddenError } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");

const eventName = {
  ASSIGNMENT_CREATED: "ASSIGNMENT_CREATED",
  ASSIGNMENT_UPDATED: "ASSIGNMENT_UPDATED",
  ASSIGNMENT_DELETED: "ASSIGNMENT_DELETED",
};

module.exports = (pubsub) => ({
  Query: {
    assignment: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      // TODO assignment resolver
      return readOne({ _id, type: "Assignment" }, { requester, models, loaders, pubsub });
    },
    assignments: (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      // TODO assignments resolver
      return readMany({ creator: requester._id, type: "Assignment" }, { requester, models, loaders, pubsub });
    },
  },
});

const { ForbiddenError } = require("apollo-server-express");
const { crudFunnel } = require("../crudHandlers");

const eventName = {
  ASSIGNMENT_CREATED: "ASSIGNMENT_CREATED",
  ASSIGNMENT_UPDATED: "ASSIGNMENT_UPDATED",
  ASSIGNMENT_DELETED: "ASSIGNMENT_DELETED",
};

module.exports = (pubsub, caches) => ({
  Query: {
    assignment: (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("Assignment", "findOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
    assignments: (parent, args, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      let ids = requester.auths.filter((a) => a.shared_resource_type == "Assignment").map((a) => a._id);
      return crudFunnel("Assignment", "find", { _id: { $in: ids } }, ids, { models, loaders, pubsub, caches });
    },
  },
});

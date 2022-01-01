const { ForbiddenError } = require("apollo-server-express");
const { crudFunnel } = require("../crudHandlers");

const eventName = {
  REGISTRATIONSECTION_CREATED: "REGISTRATIONSECTION_CREATED",
  REGISTRATIONSECTION_UPDATED: "REGISTRATIONSECTION_UPDATED",
  REGISTRATIONSECTION_DELETED: "REGISTRATIONSECTION_DELETED",
};

module.exports = (pubsub, caches) => ({
  Query: {
    registrationSection: (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("RegistrationSection", "findOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
    registrationSections: (parent, args, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      let ids = requester.auths.filter((a) => a.shared_resource_type == "RegistrationSection").map((a) => a._id);
      return crudFunnel("RegistrationSection", "find", { _id: { $in: ids } }, ids, {
        models,
        loaders,
        pubsub,
        caches,
      });
    },
  },
  Mutation: {
    createRegistrationSection: (
      parent,
      { name, course, ...args },
      { requester, models, loaders, pubsub, caches },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel(
        "RegistrationSection",
        "create",
        {
          name,
          creator: requester._id,
          course,
          parent_resource: course,
          parent_resource_type: "Course",
          ...args,
        },
        null,
        { models, loaders, pubsub, caches }
      );
    },
    updateRegistrationSection(parent, { _id, ...patch }, { requester, models, loaders, pubsub, caches }, info) {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("RegistrationSection", "updateOne", [{ _id }, patch], _id, {
        models,
        loaders,
        pubsub,
        caches,
      });
    },
    deleteRegistrationSection: (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("RegistrationSection", "deleteOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
  },
  Subscription: {
    registrationSectionCreated: {
      subscribe: () => pubsub.asyncIterator([eventName.REGISTRATIONSECTION_CREATED]),
    },
    registrationSectionUpdated: {
      subscribe: () => pubsub.asyncIterator([eventName.REGISTRATIONSECTION_UPDATED]),
    },
    registrationSectionDeleted: {
      subscribe: () => pubsub.asyncIterator([eventName.REGISTRATIONSECTION_DELETED]),
    },
  },
  RegistrationSection: {
    course: async ({ course }, args, { models, loaders, pubsub, caches }, info) =>
      crudFunnel("Course", "findOne", { _id: course }, course, { models, loaders, pubsub, caches }),
    user_groups: async ({ user_groups }, args, { requester, models, loaders, pubsub, caches }, info) => {
      let ids = user_groups.filter((a) =>
        requester.auths.map((b) => b.shared_resource.toString()).includes(a.toString())
      );
      return crudFunnel("UserGroup", "find", { _id: { $in: ids } }, ids, { models, loaders, pubsub, caches });
    },
    lectures: async ({ lectures }, args, { requester: { auths }, models, loaders, pubsub, caches }, info) => {
      let ids = lectures.filter((a) => auths.map((b) => b.shared_resource.toString()).includes(a.toString()));
      return crudFunnel("Lectures", "find", { _id: { $in: ids } }, ids, { models, loaders, pubsub, caches });
    },
  },
});

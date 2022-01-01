const { ForbiddenError } = require("apollo-server-express");
const { crudFunnel } = require("../crudHandlers");

const eventName = {
  COURSE_CREATED: "COURSE_CREATED",
  COURSE_UPDATED: "COURSE_UPDATED",
  COURSE_DELETED: "COURSE_DELETED",
};

module.exports = (pubsub, caches) => ({
  Query: {
    course: async (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return requester.auths.find((a) => a.shared_resource == _id && a.shared_resource_type == "Course")
        ? crudFunnel(
            "Course",
            "findOne",
            {
              _id,
            },
            _id,
            { models, pubsub, caches, loaders }
          )
        : null;
    },
    courses: async (parent, args, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      let ids = requester.auths.filter((a) => a.shared_resource_type == "Course").map((a) => a._id);
      return crudFunnel("Course", "find", { _id: { $in: ids } }, ids, { models, loaders, pubsub, caches });
    },
  },
  Mutation: {
    createCourse: async (parent, args, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel(
        "Course",
        "create",
        {
          creator: requester._id,
          parent_resource: requester._id,
          parent_resource_type: "User",
          ...args,
        },
        null,
        { models, loaders, pubsub, caches }
      );
    },
    updateCourse: async (parent, { _id, ...patch }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("Course", "updateOne", [{ _id }, patch], _id, {
        models,
        loaders,
        pubsub,
        caches,
      });
    },
    deleteCourse: async (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("Course", "deleteOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
  },
  Subscription: {
    courseCreated: {
      subscribe: () => pubsub.asyncIterator([eventName.COURSE_CREATED]),
    },
    courseUpdated: {
      subscribe: () => pubsub.asyncIterator([eventName.COURSE_UPDATED]),
    },
    courseDeleted: {
      subscribe: () => pubsub.asyncIterator([eventName.COURSE_DELETED]),
    },
  },
  Course: {
    user_groups: async ({ user_groups }, args, { requester: { auths }, loaders, models, pubsub, caches }, info) => {
      let ids = user_groups.filter((a) => auths.map((b) => b.shared_resource.toString()).includes(a.toString()));
      return crudFunnel(
        "UserGroup",
        "find",
        {
          _id: { $in: ids },
        },
        ids,
        { models, pubsub, caches, loaders }
      );
    },
    registration_sections: async (
      { registration_sections },
      args,
      { requester: { auths }, loaders, models, pubsub, caches },
      info
    ) => {
      let ids = registration_sections.filter((a) =>
        auths.map((b) => b.shared_resource.toString()).includes(a.toString())
      );
      return crudFunnel(
        "RegistrationSection",
        "find",
        {
          _id: { $in: ids },
        },
        ids,
        { models, pubsub, caches, loaders }
      );
    },
    lectures: async ({ lectures }, args, { requester: { auths }, loaders, models, pubsub, caches }, info) => {
      let ids = lectures.filter((a) => auths.map((b) => b.shared_resource.toString()).includes(a.toString()));
      return crudFunnel(
        "Lecture",
        "find",
        {
          _id: { $in: ids },
        },
        ids,
        { models, pubsub, caches, loaders }
      );
    },
  },
});

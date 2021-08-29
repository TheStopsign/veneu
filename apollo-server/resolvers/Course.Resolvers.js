const { ForbiddenError } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");

const eventName = {
  COURSE_CREATED: "COURSE_CREATED",
  COURSE_UPDATED: "COURSE_UPDATED",
  COURSE_DELETED: "COURSE_DELETED",
};

module.exports = (pubsub) => ({
  Query: {
    course: async (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return requester.auths.find((a) => a.shared_resource == _id && a.shared_resource_type == "Course")
        ? readOne({ _id, type: "Course" }, { requester, models, loaders, pubsub })
        : null;
    },
    courses: async (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readMany(
        { auths: { $in: requester.auths.map((a) => a._id) }, type: "Course" },
        { requester, models, loaders, pubsub }
      );
    },
  },
  Mutation: {
    createCourse: async (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return createOne(
        {
          creator: requester._id,
          parent_resource: null,
          parent_resource_type: null,
          ...args,
          type: "Course",
        },
        { requester, models, loaders, pubsub }
      );
    },
    updateCourse: async (parent, { _id, ...patch }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return updateOne({ _id, type: "Course" }, patch, { requester, models, loaders, pubsub });
    },
    deleteCourse: async (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return deleteOne({ _id, type: "Course" }, { requester, models, loaders, pubsub });
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
    user_groups: async (parent, args, { loaders: { UserGroup } }, info) => UserGroup.loadMany(parent.user_groups),
    registration_sections: async (parent, args, { loaders: { RegistrationSection } }, info) =>
      RegistrationSection.loadMany(parent.registration_sections),
    lectures: async (parent, args, { loaders: { Lecture } }, info) => Lecture.loadMany(parent.lectures),
  },
});

const { AuthenticationError, ForbiddenError } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");

const eventName = {
  REGISTRATIONSECTION_CREATED: "REGISTRATIONSECTION_CREATED",
  REGISTRATIONSECTION_UPDATED: "REGISTRATIONSECTION_UPDATED",
  REGISTRATIONSECTION_DELETED: "REGISTRATIONSECTION_DELETED",
};

module.exports = (pubsub) => ({
  Query: {
    registrationSection: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne({ _id, type: "RegistrationSection" }, { requester, models, loaders, pubsub });
    },
    registrationSections: (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readMany(
        { auths: { $in: requester.auths.map((a) => a._id) }, type: "RegistrationSection" },
        { requester, models, loaders, pubsub }
      );
    },
  },
  Mutation: {
    createRegistrationSection: (parent, { name, course, ...args }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return createOne(
        {
          name,
          creator: requester._id,
          course,
          parent_resource: course,
          parent_resource_type: "Course",
          ...args,
          type: "RegistrationSection",
        },
        { requester, models, loaders, pubsub }
      );
    },
    updateRegistrationSection(parent, { _id, ...patch }, { requester, models, loaders, pubsub }, info) {
      if (!requester) throw new ForbiddenError("Not allowed");
      return updateOne({ _id, type: "RegistrationSection" }, patch, { requester, models, loaders, pubsub });
    },
    deleteRegistrationSection: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return deleteOne({ _id, type: "RegistrationSection" }, { requester, models, loaders, pubsub });
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
    course: ({ course }, args, { loaders: { Course } }, info) => Course.load(course),
    user_groups: ({ user_groups }, args, { requester: { auths }, loaders: { UserGroup } }, info) =>
      UserGroup.loadMany(user_groups.filter((a) => auths.map((b) => b.shared_resource).includes(a))),
    lectures: ({ lectures }, args, { requester: { auths }, loaders: { Lecture } }, info) =>
      Lecture.loadMany(lectures.filter((a) => auths.map((b) => b.shared_resource).includes(a))),
  },
});

const { AuthenticationError, ForbiddenError } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");
const mongoose = require("mongoose");

const eventName = {
  USERGROUP_CREATED: "USERGROUP_CREATED",
  USERGROUP_UPDATED: "USERGROUP_UPDATED",
  USERGROUP_DELETED: "USERGROUP_DELETED",
};

module.exports = (pubsub) => ({
  Query: {
    userGroup: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne({ _id, type: "UserGroup" }, { requester, models, loaders, pubsub });
    },
    userGroups: (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readMany(
        { auths: { $in: requester.auths.map((a) => a._id) }, type: "UserGroup" },
        { requester, models, loaders, pubsub }
      );
    },
  },
  Mutation: {
    createUserGroup: (
      parent,
      { name, parent_resource, parent_resource_type },
      { requester, models, loaders, pubsub },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      if (parent_resource_type == "User" && parent_resource == requester._id) {
        return createOne(
          { name, creator: requester._id, parent_resource, parent_resource_type, type: "UserGroup" },
          { requester, models, loaders, pubsub }
        );
      } else if (
        requester.auths.find(
          (a) => a.shared_resource == parent_resource && ["ADMIN", "INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
        )
      ) {
        return createOne(
          {
            name,
            creator: requester._id,
            parent_resource,
            parent_resource_type,
            type: "UserGroup",
          },
          { requester, models, loaders, pubsub }
        );
      } else {
        throw new Error("Resource does not exist for your scope");
      }
    },
    updateUserGroup(parent, { _id, ...patch }, { requester, models, loaders, pubsub }, info) {
      if (!requester || requester._id != _id) throw new ForbiddenError("Not allowed");
      return updateOne({ _id, type: "UserGroup" }, patch, { requester, models, loaders, pubsub });
    },
    deleteUserGroup: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester || requester._id != _id) throw new ForbiddenError("Not allowed");
      return deleteOne({ _id, type: "UserGroup" }, { requester, models, loaders, pubsub });
    },
  },
  Subscription: {
    userGroupCreated: {
      subscribe: () => pubsub.asyncIterator([eventName.USERGROUP_CREATED]),
    },
    userGroupUpdated: {
      subscribe: () => pubsub.asyncIterator([eventName.USERGROUP_UPDATED]),
    },
    userGroupDeleted: {
      subscribe: () => pubsub.asyncIterator([eventName.USERGROUP_DELETED]),
    },
  },
  UserGroup: {
    user_groups: (parent, args, { loaders: { UserGroup } }, info) => UserGroup.loadMany(parent.user_groups),
    lectures: (parent, args, { loaders: { Lecture } }, info) => Lecture.loadMany(parent.lectures),
  },
});

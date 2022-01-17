const { ForbiddenError } = require("apollo-server-express");
const { createOne, updateOne, deleteOne, crudFunnel } = require("../crudHandlers");

const eventName = {
  USERGROUP_CREATED: "USERGROUP_CREATED",
  USERGROUP_UPDATED: "USERGROUP_UPDATED",
  USERGROUP_DELETED: "USERGROUP_DELETED",
};

module.exports = (pubsub, caches) => ({
  Query: {
    userGroup: (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("UserGroup", "findOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
    userGroups: (parent, args, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      let ids = requester.auths.filter((a) => a.shared_resource_type == "UserGroup").map((a) => a._id);
      return crudFunnel("UserGroup", "find", { _id: { $in: ids } }, ids, { models, loaders, pubsub, caches });
    },
  },
  Mutation: {
    createUserGroup: (
      parent,
      { name, parent_resource, parent_resource_type },
      { requester, models, loaders, pubsub, caches },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      if (parent_resource_type == "User" && parent_resource == requester._id) {
        return crudFunnel(
          "UserGroup",
          "create",
          { name, creator: requester._id, parent_resource, parent_resource_type },
          null,
          { models, loaders, pubsub, caches }
        );
      } else if (
        requester.auths.find(
          (a) => a.shared_resource == parent_resource && ["ADMIN", "INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
        )
      ) {
        return crudFunnel(
          "UserGroup",
          "create",
          {
            name,
            creator: requester._id,
            parent_resource,
            parent_resource_type,
          },
          null,
          { models, loaders, pubsub, caches }
        );
      } else {
        throw new Error("Resource does not exist for your scope");
      }
    },
    updateUserGroup(parent, { _id, ...patch }, { requester, models, loaders, pubsub, caches }, info) {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("UserGroup", "updateOne", [{ _id }, patch], _id, { models, loaders, pubsub, caches });
    },
    deleteUserGroup: (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("UserGroup", "deleteOne", { _id }, _id, { models, loaders, pubsub, caches });
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
    user_groups: async ({ user_groups }, args, { requester: { auths }, models, loaders, pubsub, caches }, info) => {
      let ids = user_groups.filter((a) => auths.map((b) => b.shared_resource.toString()).includes(a.toString()));
      return crudFunnel("UserGroup", "find", { _id: { $in: ids } }, ids, { models, loaders, pubsub, caches });
    },
    lectures: async ({ lectures }, args, { requester: { auths }, models, loaders, pubsub, caches }, info) => {
      let ids = lectures.filter((a) => auths.map((b) => b.shared_resource.toString()).includes(a.toString()));
      return crudFunnel("Lecture", "find", { _id: { $in: ids } }, ids, { models, loaders, pubsub, caches });
    },
    checkins: async ({ checkins }, args, { requester: { auths }, loaders, models, pubsub, caches }, info) => {
      let ids = checkins.filter((a) => auths.map((b) => b.shared_resource.toString()).includes(a.toString()));
      return crudFunnel(
        "Checkin",
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

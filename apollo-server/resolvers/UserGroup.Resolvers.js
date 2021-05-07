const { AuthenticationError, ForbiddenError } = require("apollo-server-express");
const mongoose = require("mongoose");

const eventName = {
  USERGROUP_CREATED: "USERGROUP_CREATED",
  USERGROUP_UPDATED: "USERGROUP_UPDATED",
  USERGROUP_DELETED: "USERGROUP_DELETED"
};

module.exports = {
  Query: {
    userGroup: (parent, { _id }, { requester, models: { UserGroup } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return UserGroup.findById({ _id: _id });
    },
    userGroups: (parent, args, { requester, models: { UserGroup, Auth } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Auth.find({ user: requester._id }).then(auths => {
        return UserGroup.find({ auths: { $in: auths } });
      });
    }
  },
  Mutation: {
    createUserGroup: (parent, { name, parent_resource, parent_resource_type }, { requester, models }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      if (parent_resource_type == "User" && parent_resource == requester._id) {
        return models.UserGroup.create({ name, creator: requester._id, parent_resource, parent_resource_type }).then(
          userGroup => {
            return global.pubsub.publish(eventName.COURSE_CREATED, { userGroupCreated: userGroup }).then(done => {
              return userGroup;
            });
          }
        );
      } else if (
        requester.auths.find(
          a => a.shared_resource == parent_resource && ["ADMIN", "INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
        )
      ) {
        return models.UserGroup.create({
          name,
          creator: requester._id,
          parent_resource,
          parent_resource_type
        }).then(userGroup => {
          return global.pubsub.publish(eventName.COURSE_CREATED, { userGroupCreated: userGroup }).then(done => {
            return userGroup;
          });
        });
      } else {
        throw new Error("Resource does not exist for your scope");
      }
    },
    updateUserGroup(parent, { _id, ...patch }, { requester, models: { UserGroup } }, info) {
      if (!requester || requester._id != _id) throw new ForbiddenError("Not allowed");
      return UserGroup.findOneAndUpdate({ _id }, patch, { new: true }).then(userGroup => {
        return global.pubsub.publish(eventName.USERGROUP_UPDATED, { userGroupUpdated: userGroup }).then(done => {
          return userGroup;
        });
      });
    },
    deleteUserGroup: (parent, { _id }, { requester, models: { UserGroup } }, info) => {
      if (!requester || requester._id != _id) throw new ForbiddenError("Not allowed");
      return UserGroup.findOne({ _id })
        .then(userGroup => userGroup.deleteOne())
        .then(userGroup => {
          return global.pubsub.publish(eventName.USERGROUP_DELETED, { userGroupDeleted: userGroup }).then(done => {
            return userGroup;
          });
        });
    }
  },
  Subscription: {
    userGroupCreated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.USERGROUP_CREATED])
    },
    userGroupUpdated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.USERGROUP_UPDATED])
    },
    userGroupDeleted: {
      subscribe: () => global.pubsub.asyncIterator([eventName.USERGROUP_DELETED])
    }
  },
  UserGroup: {
    user_groups: (parent, args, { models: { UserGroup } }, info) => {
      return UserGroup.find({ _id: { $in: parent.user_groups } });
    },
    lectures: (parent, args, { models: { Lecture } }, info) => {
      return Lecture.find({ _id: { $in: parent.lectures } });
    }
  }
};

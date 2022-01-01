const mongoose = require("mongoose");
const { flatten } = require("../generics");
const { crudFunnel } = require("../crudHandlers");

module.exports = (pubsub, caches) => {
  const UserGroup = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
      },
      auths: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Auth",
        },
      ],
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      type: {
        type: String,
        default: "UserGroup",
      },
      parent_resource: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      parent_resource_type: {
        type: String,
        required: true,
      },
      user_groups: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "UserGroup",
        },
      ],
      lectures: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lecture",
        },
      ],
    },
    {
      timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
  )
    .pre("deleteOne", { document: true }, function (next) {
      let deleted = this;
      Promise.all([
        crudFunnel("Auth", "deleteMany", { _id: { $in: deleted.auths } }, deleted.auths, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
        crudFunnel("UserGroup", "deleteMany", { _id: { $in: deleted.user_groups } }, deleted.user_groups, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
        crudFunnel("Lecture", "deleteMany", { _id: { $in: deleted.lectures } }, deleted.lectures, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
        crudFunnel(
          deleted.parent_resource_type,
          "updateOne",
          [{ _id: deleted.parent_resource }, { $pull: { user_groups: deleted._id } }],
          deleted.parent_resource,
          {
            models: mongoose.models,
            pubsub,
            caches,
          }
        ),
      ]).then((resolved) => {
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((userGroups) => {
        if (userGroups.length) {
          const groupsids = userGroups.map((a) => a._id);
          const groupsauths = flatten(userGroups.map((a) => a.auths));
          const groupsparents = userGroups.map((a) => a.parent_resource);
          const groupsparentstypes = userGroups.map((a) => a.parent_resource_type);
          const groupsgroups = flatten(userGroups.map((a) => a.user_groups));
          const groupslectures = flatten(userGroups.map((a) => a.lectures));
          Promise.all([
            crudFunnel("Auth", "deleteMany", { _id: { $in: groupsauths } }, groupsauths, {
              models: mongoose.models,
              pubsub,
              caches,
            }),
            crudFunnel("UserGroup", "deleteMany", { _id: { $in: groupsgroups } }, groupsgroups, {
              models: mongoose.models,
              pubsub,
              caches,
            }),
            crudFunnel("Lecture", "deleteMany", { _id: { $in: groupslectures } }, groupslectures, {
              models: mongoose.models,
              pubsub,
              caches,
            }),
            ...groupsparentstypes.map((groupsparentstype) =>
              crudFunnel(
                groupsparentstype,
                "updateMany",
                [{ _id: { $in: groupsparents } }, { $pullAll: { user_groups: groupsids } }],
                groupsparents,
                {
                  models: mongoose.models,
                  pubsub,
                  caches,
                }
              )
            ),
          ]).then((resolved) => {
            next();
          });
        } else next();
      });
    })
    .pre("save", function (next) {
      this.wasNew = this.isNew;
      next();
    })
    .post("save", function () {
      let saved = this;
      if (this.wasNew) {
        Promise.all([
          crudFunnel(
            "Auth",
            "create",
            {
              shared_resource: saved._id,
              shared_resource_type: "UserGroup",
              user: saved.creator,
              role: "INSTRUCTOR",
            },
            null,
            { models: mongoose.models, pubsub, caches }
          ).then((auth) => {
            pubsub.publish("AUTH_CREATED", {
              authCreated: auth,
            });
          }),
          crudFunnel(
            saved.parent_resource_type,
            "updateOne",
            [{ _id: saved.parent_resource }, { $addToSet: { user_groups: saved._id } }],
            saved.parent_resource,
            { models: mongoose.models, pubsub, caches }
          ),
        ]);
      }
    });

  return UserGroup;
};

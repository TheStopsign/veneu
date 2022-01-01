const mongoose = require("mongoose");
const { crudFunnel } = require("../crudHandlers");

module.exports = (pubsub, caches) => {
  const Auth = new mongoose.Schema(
    {
      role: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      shared_resource: mongoose.Schema.Types.ObjectId,
      shared_resource_type: String,
      type: {
        type: String,
        default: "Auth",
      },
    },
    {
      timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
  )
    .pre("deleteOne", { document: true }, function (next) {
      let deleted = this;
      Promise.all([
        crudFunnel("User", "updateOne", [{ _id: deleted._id }, { $pull: { auths: deleted._id } }], deleted.user, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
        crudFunnel(
          deleted.shared_resource_type,
          "updateOne",
          [{ _id: deleted.shared_resource }, { $pull: { auths: deleted._id } }],
          deleted.shared_resource,
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
      this.model.find(this.getFilter()).then((auths) => {
        if (auths.length) {
          const authids = auths.map((a) => a._id);
          const authusers = auths.map((a) => a.user);
          const authresources = auths.map((a) => a.shared_resource);
          const authresourcetypes = [...new Set(auths.map((a) => a.shared_resource_type))];
          Promise.all([
            crudFunnel(
              "User",
              "updateMany",
              [{ _id: { $in: authusers } }, { $pullAll: { auths: authids } }],
              authusers,
              {
                models: mongoose.models,
                pubsub,
                caches,
              }
            ),
            ...authresourcetypes.map((authresourcetype) =>
              crudFunnel(
                authresourcetype,
                "updateMany",
                [{ _id: { $in: authresources } }, { $pullAll: { auths: authids } }],
                authresources,
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
          crudFunnel("User", "updateOne", [{ _id: saved.user }, { $addToSet: { auths: saved._id } }], saved.user, {
            models: mongoose.models,
            pubsub,
            caches,
          }),
          crudFunnel(
            saved.shared_resource_type,
            "updateOne",
            [{ _id: saved.shared_resource }, { $addToSet: { auths: saved._id } }],
            saved.shared_resource,
            {
              models: mongoose.models,
              pubsub,
              caches,
            }
          ),
        ]);
      }
    });

  return Auth;
};

const mongoose = require("mongoose");
const { flatten } = require("../generics");
const { crudFunnel } = require("../crudHandlers");

module.exports = (pubsub, caches) => {
  const Checkin = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        default: "Checkin: " + new Date(),
      },
      type: {
        type: String,
        required: true,
        default: "Checkin",
      },
      auths: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Auth",
          required: true,
        },
      ],
      parent_resource: {
        type: mongoose.Schema.Types.ObjectId,
      },
      parent_resource_type: { type: String },
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      tickets: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ticket",
          required: true,
        },
      ],
      ticketing_requires_authentication: {
        type: Boolean,
        required: true,
        default: false,
      },
      ticketing_requires_authorization: {
        type: Boolean,
        required: true,
        default: false,
      },
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
        crudFunnel("Ticket", "deleteMany", { _id: { $in: deleted.tickets } }, deleted.tickets, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
        crudFunnel(
          "User",
          "updateOne",
          [{ _id: deleted.creator }, { $pull: { checkins: deleted._id } }],
          deleted.creator,
          {
            models: mongoose.models,
            pubsub,
            caches,
          }
        ),
        crudFunnel(
          deleted.parent_resource_type,
          "updateOne",
          [{ _id: deleted.parent_resource }, { $pull: { checkins: deleted._id } }],
          deleted.parent_resource,
          {
            models: mongoose.models,
            pubsub,
            caches,
          }
        ),
      ]).then(() => {
        caches[deleted.type].del(deleted._id + "");
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((checkins) => {
        if (checkins.length) {
          const checkinsids = checkins.map((a) => a._id);
          const checkinsauths = flatten(checkins.map((a) => a.auths));
          const checkinparents = checkins.map((a) => a.parent_resource);
          const checkinparenttypes = [...new Set(checkins.map((a) => a.parent_resource_type))];
          Promise.all([
            crudFunnel("Auth", "deleteMany", { _id: { $in: checkinsauths } }, checkinsauths, {
              models: mongoose.models,
              pubsub,
              caches,
            }),
            ...checkinparenttypes.map((checkinparenttype) =>
              crudFunnel(
                checkinparenttype,
                "updateMany",
                [{ _id: { $in: checkinparents } }, { $pullAll: { checkins: checkinsids } }],
                checkinparents,
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
              shared_resource_type: "Checkin",
              user: saved.creator,
              role: "INSTRUCTOR",
            },
            null,
            {
              models: mongoose.models,
              pubsub,
              caches,
            }
          ).then((auth) => {
            pubsub.publish("AUTH_CREATED", {
              authCreated: auth,
            });
          }),
        ]).then((res) => {
          return;
        });
      }
    });

  return Checkin;
};

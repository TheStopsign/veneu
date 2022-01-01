const mongoose = require("mongoose");
const { flatten } = require("../generics");
const { crudFunnel } = require("../crudHandlers");

module.exports = (pubsub, caches) => {
  const YTVideoStream = new mongoose.Schema(
    {
      url: {
        type: String,
        required: true,
      },
      duration: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        required: true,
        default: "YTVideoStream",
      },
      assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
        required: false,
      },
      parent_resource: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      parent_resource_type: { type: String, required: true },
      creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      auths: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Auth",
          required: true,
        },
      ],
      name: {
        type: String,
        required: true,
      },
      checkins: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Checkin",
          required: false,
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
        crudFunnel("Assignment", "deleteOne", { _id: deleted.assignment }, deleted.assignment, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
        crudFunnel(
          deleted.parent_resource_type,
          "updateOne",
          [{ _id: deleted.parent_resource }, { recording: null, recording_type: null }],
          deleted.assignment,
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
      this.model.find(this.getFilter()).then((ytvs) => {
        if (ytvs.length) {
          const ytvsids = ytvs.map((a) => a._id);
          const ytvsauths = flatten(ytvs.map((a) => a.auths));
          const ytvsassignments = ytvs.map((a) => a.assignment);
          const ytvsparents = ytvs.map((a) => a.parent_resource);
          const ytvsparentstypes = ytvs.map((a) => a.parent_resource_type);
          Promise.all([
            crudFunnel("Auth", "deleteMany", { _id: { $in: ytvsauths } }, ytvsauths, {
              models: mongoose.models,
              pubsub,
              caches,
            }),
            crudFunnel("Assignment", "deleteOne", { _id: { $in: ytvsassignments } }, ytvsassignments, {
              models: mongoose.models,
              pubsub,
              caches,
            }),
            ...ytvsparentstypes.map((ytvsparentstype) =>
              crudFunnel(
                ytvsparentstype,
                "updateMany",
                [{ _id: { $in: ytvsparents } }, { recording: null, recording_type: null }],
                ytvsparents,
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
        } else {
          next();
        }
      });
    })
    .pre("save", function (next) {
      caches[this.type].del(this._id + "");
      this.wasNew = this.isNew;
      next();
    })
    .post("save", function () {
      if (this.wasNew) {
        Promise.all([
          this.model("Auth").create({
            shared_resource: this._id,
            shared_resource_type: "YTVideoStream",
            user: this.creator,
            role: "INSTRUCTOR",
          }),
          this.model(this.parent_resource_type).updateOne(
            {
              _id: this.parent_resource,
            },
            {
              recording: this._id,
              recording_type: this.type,
            }
          ),
        ])
          .then((auth) => {
            return pubsub.publish("AUTH_CREATED", {
              authCreated: auth,
            });
          })
          .then((res) => {
            return;
          });
      }
    });

  return YTVideoStream;
};

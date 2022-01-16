const mongoose = require("mongoose");
const { flatten } = require("../generics");
const { crudFunnel } = require("../crudHandlers");

module.exports = (pubsub, caches) => {
  const Lecture = new mongoose.Schema(
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
        default: "Lecture",
      },
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
        required: true,
      },
      parent_resource: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      parent_resource_type: {
        type: String,
        required: true,
      },
      recording: {
        type: mongoose.Schema.Types.ObjectId,
      },
      recording_type: {
        type: String,
      },
      checkins: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Checkin",
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
        crudFunnel(
          deleted.parent_resource_type,
          "updateOne",
          [{ _id: deleted.parent_resource }, { $pull: { lectures: deleted._id } }],
          deleted.parent_resource,
          {
            models: mongoose.models,
            pubsub,
            caches,
          }
        ),
        crudFunnel(deleted.recording_type, "deleteOne", { _id: deleted.recording }, deleted.recording, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
        crudFunnel("Checkin", "deleteMany", { _id: { $in: deleted.checkins } }, deleted.checkins, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
      ]).then((resolved) => {
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((lectures) => {
        if (lectures.length) {
          const lecturesids = lectures.map((a) => a._id);
          const lecturesauths = flatten(lectures.map((a) => a.auths));
          const lecturesparents = lectures.map((a) => a.parent_resource);
          const lecturesparenttypes = [...new Set(lectures.map((a) => a.parent_resource_type))];
          const lecturesrecordings = lectures.map((a) => a.recording);
          const lecturesrecordingstypes = [...new Set(lectures.map((a) => a.recording_type))];
          const lecturescheckinsids = flatten(lectures.map((a) => a.checkins));
          Promise.all([
            crudFunnel("Auth", "deleteMany", { _id: { $in: lecturesauths } }, lecturesauths, {
              models: mongoose.models,
              pubsub,
              caches,
            }),
            crudFunnel("Checkin", "deleteMany", { _id: { $in: lecturescheckinsids } }, lecturescheckinsids, {
              models: mongoose.models,
              pubsub,
              caches,
            }),
            ...lecturesrecordingstypes.map((lecturesrecordingstype) =>
              crudFunnel(
                lecturesrecordingstype,
                "deleteMany",
                { _id: { $in: lecturesrecordings } },
                lecturesrecordings,
                {
                  models: mongoose.models,
                  pubsub,
                  caches,
                }
              )
            ),
            ...lecturesparenttypes.map((lecturesparenttype) =>
              crudFunnel(
                lecturesparenttype,
                "updateMany",
                [{ _id: { $in: lecturesparents } }, { $pullAll: { lectures: lecturesids } }],
                lecturesparents,
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
      this.wasNew = this.isNew;
      next();
    })
    .post("save", function () {
      let saved = this;
      if (this.wasNew) {
        crudFunnel(
          "Auth",
          "create",
          {
            shared_resource: saved._id,
            shared_resource_type: "Lecture",
            user: saved.creator,
            role: "INSTRUCTOR",
          },
          null,
          {
            models: mongoose.models,
            pubsub,
            caches,
          }
        )
          .then((done) =>
            crudFunnel(
              saved.parent_resource_type,
              "updateOne",
              [{ _id: saved.parent_resource }, { $addToSet: { lectures: saved._id } }],
              saved.parent_resource,
              {
                models: mongoose.models,
                pubsub,
                caches,
              }
            )
          )
          .then((auth) => {
            return pubsub.publish("AUTH_CREATED", {
              resource: auth,
            });
          });
      }
    });

  return Lecture;
};

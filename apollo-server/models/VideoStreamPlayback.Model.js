const mongoose = require("mongoose");
const { crudFunnel } = require("../crudHandlers");

module.exports = (pubsub, caches) => {
  const VideoStreamPlayback = new mongoose.Schema(
    {
      type: {
        type: String,
        required: true,
        default: "VideoStreamPlayback",
      },
      submission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission",
        required: false,
      },
      video_stream: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      video_stream_type: {
        type: String,
        required: true,
      },
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      seconds_watched: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    {
      timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
  )
    .pre("deleteOne", { document: true }, function (next) {
      let deleted = this;
      Promise.all([
        crudFunnel("Submission", "deleteOne", { _id: deleted.submission }, deleted.submission, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
      ]).then((resolved) => {
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((videostreamplaybacks) => {
        if (videostreamplaybacks.length) {
          const videostreamplaybacksids = videostreamplaybacks.map((a) => a._id);
          const videostreamplaybackssubmissions = videostreamplaybacks.map((a) => a.submission);
          const videostreamplaybacksparents = videostreamplaybacks.map((a) => a.parent_resource);
          const videostreamplaybacksparentstypes = videostreamplaybacks.map((a) => a.parent_resource_type);
          Promise.all([
            crudFunnel(
              "Submission",
              "deleteMany",
              { _id: { $in: videostreamplaybackssubmissions } },
              videostreamplaybackssubmissions,
              {
                models: mongoose.models,
                pubsub,
                caches,
              }
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
      // if (this.wasNew) {
      // }
    });

  return VideoStreamPlayback;
};

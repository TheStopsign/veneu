const mongoose = require("mongoose");

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
      Promise.all([mongoose.model("Submission").deleteOne({ submittable: deleted._id })]).then((resolved) => {
        caches[deleted.type].del(deleted._id + "");
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((videostreamplaybacks) => {
        if (videostreamplaybacks.length) {
          const videostreamplaybacksids = videostreamplaybacks.map((a) => a._id);
          const videostreamplaybacksparents = videostreamplaybacks.map((a) => a.parent_resource);
          Promise.all([
            mongoose.model("Submission").deleteMany({ submittable: { $in: videostreamplaybacksids } }),
          ]).then((resolved) => {
            videostreamplaybacks.forEach(function (deleted) {
              caches[deleted.type].del(deleted._id + "");
            });
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
      // if (this.wasNew) {
      // }
    });

  return VideoStreamPlayback;
};

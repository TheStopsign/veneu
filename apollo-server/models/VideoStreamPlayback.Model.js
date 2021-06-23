const mongoose = require("mongoose");

const VideoStreamPlayback = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      required: true,
      default: "VideoStreamPlayback"
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: false
    },
    parent_resource: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    parent_resource_type: { type: String, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    auths: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
        required: true
      }
    ],
    name: {
      type: String,
      required: true
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
)
  .pre("deleteOne", { document: true }, function(next) {
    Promise.all([
      mongoose.model("Auth").deleteMany({ shared_resource: this._id }),
      mongoose.model("Assignment").deleteOne({ assignable: this._id }),
      mongoose.model(this.parent_resource_type).updateOne({ recording: null, recording_type: null })
    ]).then(resolved => {
      next();
    });
  })
  .pre("deleteMany", function(next) {
    this.model.find(this.getFilter()).then(videostreamplaybacks => {
      if (videostreamplaybacks.length) {
        const videostreamplaybacksids = videostreamplaybacks.map(a => a._id);
        const videostreamplaybacksparents = videostreamplaybacks.map(a => a.parent_resource);
        Promise.all([
          mongoose.model("Auth").deleteMany({ shared_resource: { $in: videostreamplaybacksids } }),
          mongoose.model("Assignment").deleteMany({ assignable: { $in: videostreamplaybacksids } }),
          mongoose
            .model(this.parent_resource_type)
            .updateMany({ _id: { $in: videostreamplaybacksparents } }, { recording: null, recording_type: null })
        ]).then(resolved => {
          next();
        });
      } else {
        next();
      }
    });
  })
  .pre("save", function(next) {
    this.wasNew = this.isNew;
    next();
  })
  .post("save", function() {
    if (this.wasNew) {
      Promise.all([
        this.model("Auth").create({
          shared_resource: this._id,
          shared_resource_type: "VideoStreamPlayback",
          user: this.creator._id,
          role: "INSTRUCTOR"
        }),
        this.model(this.parent_resource_type).updateOne(
          {
            _id: this.parent_resource
          },
          {
            recording: this._id,
            recording_type: this.type
          }
        )
      ])
        .then(auth => {
          return global.pubsub.publish("AUTH_CREATED", {
            authCreated: auth
          });
        })
        .then(res => {
          return;
        });
    }
  });

module.exports = mongoose.model("VideoStreamPlayback", VideoStreamPlayback);

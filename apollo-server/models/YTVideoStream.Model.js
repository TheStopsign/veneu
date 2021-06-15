const mongoose = require("mongoose");

const YTVideoStream = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      default: "YTVideoStream"
    },
    parent_resource: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    parent_resource_type: { type: mongoose.Schema.Types.ObjectId, required: true },
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
      mongoose.model(this.parent_resource_type).updateOne({ recording: null, recording_type: null })
    ]).then(resolved => {
      next();
    });
  })
  .pre("deleteMany", function(next) {
    this.model.find(this.getFilter()).then(ytvs => {
      if (ytvs.length) {
        const ytvsids = ytvs.map(a => a._id);
        const ytvsparents = ytvs.map(a => a.parent_resource);
        Promise.all([
          mongoose.model("Auth").deleteMany({ shared_resource: { $in: ytvsids } }),
          mongoose.model("Course").updateMany({ _id: { $in: ytvsparents } }, { recording: null, recording_type: null }),
          mongoose
            .model("RegistrationSection")
            .updateMany({ _id: { $in: ytvsparents } }, { recording: null, recording_type: null }),
          mongoose
            .model("UserGroup")
            .updateMany({ _id: { $in: ytvsparents } }, { recording: null, recording_type: null }),
          mongoose.model("Lecture").updateMany({ _id: { $in: ytvsparents } }, { recording: null, recording_type: null })
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
          shared_resource_type: "YTVideoStream",
          user: this.creator._id,
          role: "INSTRUCTOR"
        })
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

module.exports = mongoose.model("YTVideoStream", YTVideoStream);

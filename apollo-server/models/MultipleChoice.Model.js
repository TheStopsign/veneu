const mongoose = require("mongoose");

module.exports = (pubsub, caches) => {
  const MultipleChoice = new mongoose.Schema(
    {
      type: {
        type: String,
        required: true,
        default: "MultipleChoice",
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
      question: {
        type: String,
        required: true,
      },
      choices: [
        {
          type: String,
          required: true,
        },
      ],
      answers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Answer",
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
        mongoose.model("Auth").deleteMany({ shared_resource: deleted._id }),
        mongoose.model("Assignment").deleteOne({ assignable: deleted._id }),
        mongoose.model(deleted.parent_resource_type).updateOne({ recording: null, recording_type: null }),
      ]).then((resolved) => {
        caches[deleted.type].del(deleted._id + "");
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((ytvs) => {
        if (ytvs.length) {
          const ytvsids = ytvs.map((a) => a._id);
          const ytvsparents = ytvs.map((a) => a.parent_resource);
          Promise.all([
            mongoose.model("Auth").deleteMany({ shared_resource: { $in: ytvsids } }),
            mongoose.model("Assignment").deleteMany({ assignable: { $in: ytvsids } }),
            mongoose
              .model("Lecture")
              .updateMany({ _id: { $in: ytvsparents } }, { recording: null, recording_type: null }),
          ]).then((resolved) => {
            ytvs.forEach(function (deleted) {
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

  return MultipleChoice;
};

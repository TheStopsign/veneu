const mongoose = require("mongoose");

module.exports = (pubsub, caches) => {
  const Submission = new mongoose.Schema(
    {
      type: {
        type: String,
        required: true,
        default: "Submission",
      },
      submittable: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      submittable_type: {
        type: String,
        required: true,
      },
      assignment: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Assignment",
          required: true,
        },
      ],
      is_submitted: {
        type: Boolean,
        default: false,
        required: false,
      },
      grade: {
        type: Number,
        required: false,
      },
      progress: {
        type: Number,
        required: false,
      },
    },
    {
      timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
  )
    .pre("deleteOne", { document: true }, function (next) {
      let deleted = this;
      Promise.all([
        mongoose.model("Assignment").updateOne({ _id: deleted.assignment }, { $pull: { submissions: deleted._id } }),
        mongoose.model(deleted.submittable_type).updateOne({ _id: deleted.submittable }, { submission: null }),
      ]).then((resolved) => {
        caches[deleted.type].del(deleted._id + "");
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((submissions) => {
        if (submissions.length) {
          const submissionsids = submissions.map((a) => a._id);
          Promise.all([
            mongoose
              .model("Assignment")
              .updateMany({ submissions: { $in: submissionsids } }, { $pullAll: { submissions: submissionsids } }),
            mongoose
              .model("VideoStreamPlayback")
              .updateMany({ submission: { $in: submissionsids } }, { submission: null }),
          ]).then((resolved) => {
            submissions.forEach(function (deleted) {
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
        mongoose
          .model(this.submittable_type)
          .updateOne(
            {
              _id: this.submittable,
            },
            {
              $addToSet: { submissions: this._id },
            }
          )
          .then((auth) => {
            return;
          });
      }
    });

  return Submission;
};

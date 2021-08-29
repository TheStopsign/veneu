const mongoose = require("mongoose");

module.exports = (pubsub) => {
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
      Promise.all([
        mongoose.model("Assignment").updateOne({ _id: this.assignment }, { $pull: { submissions: this._id } }),
        mongoose.model(this.submittable_type).updateOne({ _id: this.submittable }, { submission: null }),
      ]).then((resolved) => {
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

  return mongoose.model("Submission", Submission);
};

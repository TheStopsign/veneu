const mongoose = require("mongoose");
module.exports = (pubsub, caches) => {
  const Assignment = new mongoose.Schema(
    {
      type: {
        type: String,
        required: true,
        default: "Assignment",
      },
      assignable: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      assignable_type: {
        type: String,
        required: true,
      },
      submissions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Submission",
          required: true,
        },
      ],
      points: {
        type: Number,
        required: false,
      },
      hidden_until: {
        type: Date,
        required: false,
      },
      due: {
        type: Date,
        required: true,
      },
    },
    {
      timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
  )
    .pre("deleteOne", { document: true }, function (next) {
      let deleted = this;
      Promise.all([
        mongoose.model(this.assignable_type).updateOne({ _id: deleted.assignable }, { assignment: null }),
      ]).then((resolved) => {
        caches[deleted.type].del(deleted._id + "");
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((assignments) => {
        if (assignments.length) {
          const assignmentsids = assignments.map((a) => a._id);
          Promise.all([
            mongoose.model("YTVideoStream").updateMany({ assignment: { $in: assignmentsids } }, { assignment: null }),
          ]).then((resolved) => {
            assignments.forEach(function (deleted) {
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
          .model(this.assignable_type)
          .updateOne(
            {
              _id: this.assignable,
            },
            {
              assignment: this._id,
            }
          )
          .then((auth) => {});
      }
    });

  return Assignment;
};

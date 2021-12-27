const mongoose = require("mongoose");

module.exports = (pubsub, caches) => {
  const Notification = new mongoose.Schema(
    {
      text: {
        type: String,
        required: true,
      },
      redirect: {
        type: String,
        required: true,
      },
      seen: {
        type: Boolean,
        required: true,
        default: false,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      type: {
        type: String,
        default: "Notification",
      },
    },
    {
      timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
  )
    .pre("deleteOne", { document: true }, function (next) {
      let deleted = this;
      Promise.all([
        this.model("User").findByIdAndUpdate({ _id: this.user }, { $pull: { notifications: this._id } }),
      ]).then((resolved) => {
        caches[deleted.type].del(deleted._id + "");
        next();
      });
    })
    .pre("save", function (next) {
      caches[this.type].del(this._id + "");
      this.wasNew = this.isNew;
      next();
    })
    .post("save", function () {
      if (this.wasNew) {
        this.model("User").findOneAndUpdate({ _id: this.user }, { $addToSet: { notifications: this._id } });
      }
    });

  return Notification;
};

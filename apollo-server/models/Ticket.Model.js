const mongoose = require("mongoose");

module.exports = (pubsub, caches) => {
  const Ticket = new mongoose.Schema(
    {
      email: {
        type: String,
        required: true,
      },
      user: {
        type: String,
        required: true,
      },
      code: {
        type: String,
        required: true,
        unique: true,
      },
      checkin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Checkin",
        required: true,
      },
      type: {
        type: String,
        default: "Ticket",
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
        mongoose.model("Checkin").updateOne({ _id: deleted.checkin }, { $pull: { tickets: deleted._id } }),
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
        Promise.all([
          mongoose.model("Checkin").updateOne(
            {
              _id: this.checkin,
            },
            {
              $addToSet: { tickets: this._id },
            }
          ),
        ]).then((res) => {
          return;
        });
      }
    });

  return Ticket;
};

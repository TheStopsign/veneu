const mongoose = require("mongoose");
const { crudFunnel } = require("../crudHandlers");

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
        crudFunnel(
          "Checkin",
          "updateOne",
          [{ _id: deleted.checkin }, { $pull: { tickets: deleted._id } }],
          deleted.checkin,
          { models: mongoose.models, pubsub, caches }
        ),
      ]).then((resolved) => {
        next();
      });
    })
    .pre("save", function (next) {
      this.wasNew = this.isNew;
      next();
    })
    .post("save", function () {
      let saved = this;
      if (this.wasNew) {
        Promise.all([
          crudFunnel(
            "Checkin",
            "updateOne",
            [
              {
                _id: saved.checkin,
              },
              {
                $addToSet: { tickets: saved._id },
              },
            ],
            saved.checkin,
            { models: mongoose.models, pubsub, caches }
          ),
        ]).then((res) => {
          return;
        });
      }
    });

  return Ticket;
};

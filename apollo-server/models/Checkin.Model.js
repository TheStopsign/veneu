const mongoose = require("mongoose");
module.exports = (pubsub) => {
  const Checkin = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        default: "Checkin: " + new Date(),
      },
      type: {
        type: String,
        required: true,
        default: "Checkin",
      },
      auths: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Auth",
          required: true,
        },
      ],
      parent_resource: {
        type: mongoose.Schema.Types.ObjectId,
      },
      parent_resource_type: { type: String },
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      tickets: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ticket",
          required: true,
        },
      ],
    },
    {
      timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
  )
    .pre("deleteOne", { document: true }, function (next) {
      Promise.all([
        mongoose.model("Auth").deleteMany({ shared_resource: this._id }),
        mongoose.model("Ticket").deleteMany({ _id: { $in: this.tickets } }),
        mongoose.model("User").updateOne({ _id: this.creator }, { $pull: { checkins: this._id } }),
      ]).then((resolved) => {
        next();
      });
    })
    .pre("save", function (next) {
      this.wasNew = this.isNew;
      next();
    })
    .post("save", function () {
      if (this.wasNew) {
        Promise.all([
          mongoose
            .model("Auth")
            .create({
              shared_resource: this._id,
              shared_resource_type: "Checkin",
              user: this.creator._id,
              role: "INSTRUCTOR",
            })
            .then((auth) => {
              pubsub.publish("AUTH_CREATED", {
                authCreated: auth,
              });
            }),
        ]).then((res) => {
          return;
        });
      }
    });

  return mongoose.model("Checkin", Checkin);
};

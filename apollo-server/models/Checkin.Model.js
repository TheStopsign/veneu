const mongoose = require("mongoose");
const { flatten } = require("../generics");

module.exports = (pubsub, caches) => {
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
      ticketing_requires_authentication: {
        type: Boolean,
        required: true,
        default: false,
      },
      ticketing_requires_authorization: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    {
      timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
  )
    .pre("deleteOne", { document: true }, function (next) {
      let deleted = this;
      Promise.all([
        mongoose.model("Auth").deleteMany({ shared_resource: deleted._id }),
        mongoose.model("Ticket").deleteMany({ _id: { $in: deleted.tickets } }),
        mongoose.model("User").updateOne({ _id: deleted.creator }, { $pull: { checkins: deleted._id } }),
        mongoose.model("Lecture").updateOne({ _id: deleted.parent_resource }, { $pull: { checkins: deleted._id } }),
      ]).then(() => {
        caches[deleted.type].del(deleted._id + "");
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((checkins) => {
        if (checkins.length) {
          const checkinsids = checkins.map((a) => a._id);
          const checkinsauths = flatten(checkins.map((a) => a.auths));
          Promise.all([mongoose.model("Auth").deleteMany({ _id: { $in: checkinsauths } })]).then((resolved) => {
            checkins.forEach(function (deleted) {
              caches[deleted.type].del(deleted._id + "");
            });
            next();
          });
        } else next();
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

  return Checkin;
};

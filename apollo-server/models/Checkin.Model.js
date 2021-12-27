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
        deleted.model("Auth").deleteMany({ shared_resource: deleted._id }),
        deleted.model("UserGroup").deleteMany({ parent_resource: deleted._id }),
        deleted.model("Lecture").deleteMany({ parent_resource: deleted._id }),
        deleted.model("Course").updateOne({ _id: deleted.course }, { $pull: { registration_sections: deleted._id } }),
      ]).then(() => {
        caches["Checkin"].del(deleted._id + "");
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((checkins) => {
        if (checkins.length) {
          const checkinsids = checkins.map((a) => a._id);
          const sectionsauths = flatten(checkins.map((a) => a.auths));
          Promise.all([mongoose.model("Auth").deleteMany({ _id: { $in: sectionsauths } })]).then((resolved) => {
            checkinsids.forEach(function (checkinid) {
              caches["Checkin"].del(checkinid + "");
            });
            next();
          });
        } else next();
      });
    })
    .pre("deleteOne", { document: true }, function (next) {
      Promise.all([
        mongoose.model("Auth").deleteMany({ shared_resource: this._id }),
        mongoose.model("Ticket").deleteMany({ _id: { $in: this.tickets } }),
        mongoose.model("User").updateOne({ _id: this.creator }, { $pull: { checkins: this._id } }),
        mongoose.model("Lecture").updateOne({ _id: this.parent_resource }, { $pull: { checkins: this._id } }),
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

  return Checkin;
};

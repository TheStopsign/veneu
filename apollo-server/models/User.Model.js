const mongoose = require("mongoose");
const { flatten } = require("../generics");
const { crudFunnel } = require("../crudHandlers");

module.exports = (pubsub, caches) => {
  const User = new mongoose.Schema(
    {
      first_name: {
        type: String,
        required: true,
        default: "New",
      },
      last_name: {
        type: String,
        required: true,
        default: "User",
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
        required: false,
      },
      auths: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      notifications: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Notification",
        },
      ],
      type: {
        type: String,
        default: "User",
      },
      access_code: {
        type: String,
      },
      active: {
        type: Boolean,
        default: false,
        required: true,
      },
      checkins: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Checkin",
          required: true,
        },
      ],
    },
    {
      timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
  )
    .pre("deleteOne", function (next) {
      let deleted = this;
      Promise.all([
        crudFunnel("Auth", "deleteMany", { _id: { $in: deleted.auths } }, deleted.auths, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
        crudFunnel("Notification", "deleteMany", { _id: { $in: deleted.notifications } }, deleted.notifications, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
      ]).then((resolved) => {
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((users) => {
        if (users.length) {
          const usersauths = flatten(users.map((a) => a.auths));
          Promise.all([
            crudFunnel("Auth", "deleteMany", { _id: { $in: usersauths } }, usersauths, {
              models: mongoose.models,
              pubsub,
              caches,
            }),
          ]).then((resolved) => {
            next();
          });
        } else next();
      });
    })
    .pre("save", function (next) {
      this.wasNew = this.isNew;
      if (this.isNew) {
        this.access_code = "";
        var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < 24; i++) {
          this.access_code += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
      }
      next();
    })
    .post("save", function () {
      if (this.wasNew) {
        //console.log("");
      }
    });

  return User;
};

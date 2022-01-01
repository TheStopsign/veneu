const mongoose = require("mongoose");
const { crudFunnel } = require("../crudHandlers");

module.exports = (pubsub, caches) => {
  const Course = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
      },
      auths: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Auth",
        },
      ],
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      type: {
        type: String,
        default: "Course",
      },
      prefix: {
        type: String,
        required: true,
      },
      suffix: {
        type: Number,
        required: true,
      },
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
        required: true,
      },
      description: {
        type: String,
        required: false,
      },
      user_groups: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "UserGroup",
        },
      ],
      registration_sections: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "RegistrationSection",
        },
      ],
      lectures: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lecture",
        },
      ],
      parent_resource: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
      },
      parent_resource_type: {
        type: String,
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
        crudFunnel("Auth", "deleteMany", { _id: { $in: deleted.auths } }, deleted.auths, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
        crudFunnel("UserGroup", "deleteMany", { _id: { $in: deleted.user_groups } }, deleted.user_groups, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
        crudFunnel(
          "RegistrationSection",
          "deleteMany",
          { _id: { $in: deleted.registration_sections } },
          deleted.registration_sections,
          {
            models: mongoose.models,
            pubsub,
            caches,
          }
        ),
        crudFunnel("Lecture", "deleteMany", { _id: { $in: deleted.lectures } }, deleted.lectures, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
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
        crudFunnel(
          "Auth",
          "create",
          {
            shared_resource: saved._id,
            shared_resource_type: "Course",
            user: saved.creator,
            role: "INSTRUCTOR",
          },
          null,
          {
            models: mongoose.models,
            pubsub,
            caches,
          }
        );
      }
    });

  return Course;
};

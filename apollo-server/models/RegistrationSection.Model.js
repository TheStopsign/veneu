const mongoose = require("mongoose");
const { flatten } = require("../generics");
const { crudFunnel } = require("../crudHandlers");

module.exports = (pubsub, caches) => {
  const RegistrationSection = new mongoose.Schema(
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
        default: "RegistrationSection",
      },
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      user_groups: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "UserGroup",
        },
      ],
      lectures: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lecture",
        },
      ],
      meeting_times: [
        {
          type: Object,
        },
      ],
      parent_resource: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      parent_resource_type: {
        type: String,
        required: true,
      },
      checkins: [{ type: mongoose.Schema.Types.ObjectId, ref: "Checkin" }],
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
        crudFunnel("Lecture", "deleteMany", { _id: { $in: deleted.lectures } }, deleted.lectures, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
        crudFunnel("Checkin", "deleteMany", { _id: { $in: deleted.checkins } }, deleted.checkins, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
        crudFunnel(
          "Course",
          "updateOne",
          [{ _id: deleted.course }, { $pull: { registration_sections: deleted._id } }],
          deleted.course,
          {
            models: mongoose.models,
            pubsub,
            caches,
          }
        ),
      ]).then(() => {
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((registrationSections) => {
        if (registrationSections.length) {
          const sectionsids = registrationSections.map((a) => a._id);
          const sectionsauths = flatten(registrationSections.map((a) => a.auths));
          const sectionscourses = registrationSections.map((a) => a.parent_resource);
          const sectionsgroups = flatten(registrationSections.map((a) => a.user_groups));
          const sectionslectures = flatten(registrationSections.map((a) => a.lectures));
          const sectionscheckins = flatten(registrationSections.map((a) => a.checkins));
          Promise.all([
            crudFunnel("Auth", "deleteMany", { _id: { $in: sectionsauths } }, sectionsauths, {
              models: mongoose.models,
              pubsub,
              caches,
            }),
            crudFunnel(
              "Course",
              "updateMany",
              [{ _id: { $in: sectionscourses } }, { $pullAll: { registration_sections: sectionsids } }],
              sectionscourses,
              {
                models: mongoose.models,
                pubsub,
                caches,
              }
            ),
            crudFunnel("UserGroup", "deleteMany", { _id: { $in: sectionsgroups } }, sectionsgroups, {
              models: mongoose.models,
              pubsub,
              caches,
            }),
            crudFunnel("Lecture", "deleteMany", { _id: { $in: sectionslectures } }, sectionslectures, {
              models: mongoose.models,
              pubsub,
              caches,
            }),
            crudFunnel("Checkin", "deleteMany", { _id: { $in: sectionscheckins } }, sectionscheckins, {
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
      caches[this.type].del(this._id + "");
      this.wasNew = this.isNew;
      next();
    })
    .post("save", function () {
      let saved = this;
      if (this.wasNew) {
        Promise.all([
          crudFunnel(
            "Auth",
            "create",
            {
              shared_resource: saved._id,
              shared_resource_type: "RegistrationSection",
              user: saved.creator,
              role: "INSTRUCTOR",
            },
            null,
            {
              models: mongoose.models,
              pubsub,
              caches,
            }
          ).then((auth) =>
            pubsub.publish("AUTH_CREATED", {
              resource: auth,
            })
          ),
          crudFunnel(
            "Course",
            "updateOne",
            [{ _id: saved.parent_resource }, { $addToSet: { registration_sections: saved._id } }],
            saved.parent_resource,
            { models: mongoose.models, pubsub, caches }
          ),
        ]);
      }
    });

  return RegistrationSection;
};

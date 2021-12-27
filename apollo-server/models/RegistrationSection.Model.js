const mongoose = require("mongoose");
const { flatten } = require("../generics");

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
    },
    {
      timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
  )
    .pre("deleteOne", { document: true }, function (next) {
      let deleted = this;
      Promise.all([
        mongoose.model("Auth").deleteMany({ shared_resource: deleted._id }),
        mongoose.model("UserGroup").deleteMany({ parent_resource: deleted._id }),
        mongoose.model("Lecture").deleteMany({ parent_resource: deleted._id }),
        mongoose.model("Course").updateOne({ _id: deleted.course }, { $pull: { registration_sections: deleted._id } }),
      ]).then(() => {
        caches[deleted.type].del(deleted._id + "");
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
          Promise.all([
            mongoose.model("Auth").deleteMany({ _id: { $in: sectionsauths } }),
            mongoose
              .model("Course")
              .updateMany({ _id: { $in: sectionscourses } }, { $pullAll: { registration_sections: sectionsids } }),
            mongoose.model("UserGroup").deleteMany({ _id: { $in: sectionsgroups } }),
            mongoose.model("Lecture").deleteMany({ _id: { $in: sectionslectures } }),
          ]).then((resolved) => {
            registrationSections.forEach(function (deleted) {
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
          this.model("Auth")
            .create({
              shared_resource: this._id,
              shared_resource_type: "RegistrationSection",
              user: this.creator._id,
              role: "INSTRUCTOR",
            })
            .then((auth) =>
              pubsub.publish("AUTH_CREATED", {
                authCreated: auth,
              })
            ),
          this.model("Course").findByIdAndUpdate(
            { _id: this.course },
            { $addToSet: { registration_sections: this._id } }
          ),
        ]);
      }
    });

  return RegistrationSection;
};

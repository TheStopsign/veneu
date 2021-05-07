const mongoose = require("mongoose");

const RegistrationSection = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    auths: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth"
      }
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    type: {
      type: String,
      default: "RegistrationSection"
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course"
    },
    user_groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserGroup"
      }
    ],
    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture"
      }
    ],
    meeting_times: [
      {
        type: Object
      }
    ],
    parent_resource: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    parent_resource_type: {
      type: String,
      required: true
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
)
  .pre("deleteOne", { document: true }, function(next) {
    Promise.all([
      this.model("Auth").deleteMany({ shared_resource: this._id }),
      this.model("UserGroup").deleteMany({ parent_resource: this._id }),
      this.model("Lecture").deleteMany({ parent_resource: this._id }),
      this.model("Course").updateOne({ _id: this.course }, { $pull: { registration_sections: this._id } })
    ]).then(() => {
      next();
    });
  })
  .pre("deleteMany", function(next) {
    this.model.find(this.getFilter()).then(registrationSections => {
      if (registrationSections.length) {
        const sectionsids = registrationSections.map(a => a._id);
        const sectionsauths = registrationSections.map(a => a.auths).flat();
        const sectionscourses = registrationSections.map(a => a.parent_resource);
        const sectionsgroups = registrationSections.map(a => a.user_groups).flat();
        const sectionslectures = registrationSections.map(a => a.lectures).flat();
        Promise.all([
          mongoose.model("Auth").deleteMany({ _id: { $in: sectionsauths } }),
          mongoose
            .model("Course")
            .updateMany({ _id: { $in: sectionscourses } }, { $pullAll: { registration_sections: sectionsids } }),
          mongoose.model("UserGroup").deleteMany({ _id: { $in: sectionsgroups } }),
          mongoose.model("Lecture").deleteMany({ _id: { $in: sectionslectures } })
        ]).then(resolved => {
          next();
        });
      } else next();
    });
  })
  .pre("save", function(next) {
    this.wasNew = this.isNew;
    next();
  })
  .post("save", function() {
    if (this.wasNew) {
      Promise.all([
        this.model("Auth")
          .create({
            shared_resource: this._id,
            shared_resource_type: "RegistrationSection",
            user: this.creator._id,
            role: "INSTRUCTOR"
          })
          .then(auth => {
            global.pubsub.publish("AUTH_CREATED", {
              authCreated: auth
            });
          }),
        this.model("Course").findByIdAndUpdate({ _id: this.course }, { $addToSet: { registration_sections: this._id } })
      ]);
    }
  });

module.exports = mongoose.model("RegistrationSection", RegistrationSection);

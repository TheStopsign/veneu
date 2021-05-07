const mongoose = require("mongoose");

const Course = new mongoose.Schema(
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
      default: "Course"
    },
    prefix: {
      type: String,
      required: true
    },
    suffix: {
      type: Number,
      required: true
    },
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    user_groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserGroup"
      }
    ],
    registration_sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RegistrationSection"
      }
    ],
    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture"
      }
    ],
    parent_resource: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    parent_resource_type: {
      type: String,
      required: false
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
)
  .pre("deleteOne", { document: true }, function(next) {
    Promise.all([
      mongoose.model("Auth").deleteMany({ shared_resource: this._id, shared_resource_type: "Course" }),
      mongoose.model("UserGroup").deleteMany({ _id: { $in: this.user_groups } }),
      mongoose.model("RegistrationSection").deleteMany({ _id: { $in: this.registration_sections } }),
      mongoose.model("Lecture").deleteMany({ _id: { $in: this.lectures } })
    ]).then(resolved => {
      next();
    });
  })
  .pre("save", function(next) {
    this.wasNew = this.isNew;
    next();
  })
  .post("save", function() {
    if (this.wasNew) {
      mongoose
        .model("Auth")
        .create({
          shared_resource: this._id,
          shared_resource_type: "Course",
          user: this.creator._id,
          role: "INSTRUCTOR"
        })
        .then(auth => {
          global.pubsub.publish("AUTH_CREATED", {
            authCreated: auth
          });
        });
    }
  });

module.exports = mongoose.model("Course", Course);

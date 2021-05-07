const mongoose = require("mongoose");

const UserGroup = new mongoose.Schema(
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
      default: "UserGroup"
    },
    parent_resource: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    parent_resource_type: {
      type: String,
      required: true
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
    ]
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
)
  .pre("deleteOne", { document: true }, function(next) {
    Promise.all([
      mongoose.model("Auth").deleteMany({ shared_resource: this._id }),
      mongoose.model("Course").updateOne({ _id: this.parent_resource }, { $pull: { user_groups: this._id } }),
      mongoose.model("UserGroup").updateOne({ _id: this.parent_resource }, { $pull: { user_groups: this._id } }),
      mongoose
        .model("RegistrationSection")
        .updateOne({ _id: this.parent_resource }, { $pull: { user_groups: this._id } }),
      mongoose.model("UserGroup").deleteMany({ _id: { $in: this.user_groups } }),
      mongoose.model("Lecture").deleteMany({ parent_resource: this._id })
    ]).then(next);
  })
  .pre("deleteMany", function(next) {
    this.model.find(this.getFilter()).then(userGroups => {
      if (userGroups.length) {
        const groupsids = userGroups.map(a => a._id);
        const groupsparents = userGroups.map(a => a.parent_resource);
        const groupsgroups = userGroups.map(a => a.user_groups).flat();
        const groupslectures = userGroups.map(a => a.lectures).flat();
        Promise.all([
          mongoose.model("Auth").deleteMany({ shared_resource: { $in: groupsids } }),
          mongoose
            .model("Course")
            .updateMany({ _id: { $in: groupsparents } }, { $pullAll: { user_groups: groupsids } }),
          mongoose
            .model("RegistrationSection")
            .updateMany({ _id: { $in: groupsparents } }, { $pullAll: { user_groups: groupsids } }),
          mongoose.model("UserGroup").deleteMany({ _id: { $in: groupsgroups } }),
          mongoose.model("Lecture").deleteMany({ _id: { $in: groupslectures } })
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
        mongoose
          .model("Auth")
          .create({
            shared_resource: this._id,
            shared_resource_type: "UserGroup",
            user: this.creator._id,
            role: "INSTRUCTOR"
          })
          .then(auth => {
            global.pubsub.publish("AUTH_CREATED", {
              authCreated: auth
            });
          }),
        mongoose
          .model("Course")
          .findByIdAndUpdate({ _id: this.parent_resource }, { $addToSet: { user_groups: this._id } }),
        mongoose
          .model("UserGroup")
          .findByIdAndUpdate({ _id: this.parent_resource }, { $addToSet: { user_groups: this._id } }),
        mongoose
          .model("RegistrationSection")
          .findByIdAndUpdate({ _id: this.parent_resource }, { $addToSet: { user_groups: this._id } })
      ]);
    }
  });

module.exports = mongoose.model("UserGroup", UserGroup);

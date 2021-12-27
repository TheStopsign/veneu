const mongoose = require("mongoose");
const { flatten } = require("../generics").default;

module.exports = (pubsub) => {
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
        default: "Question",
      },
      parent_resource: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      parent_resource_type: {
        type: String,
        required: true,
      },
      question: {
        type: String,
        required: true,
      },
    },
    {
      timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
  )
    .pre("deleteOne", { document: true }, function (next) {
      Promise.all([this.model("Auth").deleteMany({ shared_resource: this._id })]).then(() => {
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((registrationSections) => {
        if (registrationSections.length) {
          const sectionsids = registrationSections.map((a) => a._id);
          const sectionsauths = flatten(registrationSections.map((a) => a.auths));
          Promise.all([mongoose.model("Auth").deleteMany({ _id: { $in: sectionsauths } })]).then((resolved) => {
            next();
          });
        } else next();
      });
    })
    .pre("save", function (next) {
      this.wasNew = this.isNew;
      next();
    })
    .post("save", function () {
      if (this.wasNew) {
        Promise.all([
          this.model("Auth")
            .create({
              shared_resource: this._id,
              shared_resource_type: "Question",
              user: this.creator._id,
              role: "INSTRUCTOR",
            })
            .then((auth) =>
              pubsub.publish("AUTH_CREATED", {
                authCreated: auth,
              })
            ),
        ]);
      }
    });

  return RegistrationSection;
};

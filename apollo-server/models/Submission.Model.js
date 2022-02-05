const mongoose = require("mongoose");
const { crudFunnel } = require("../crudHandlers");

module.exports = (pubsub, caches) => {
  const Submission = new mongoose.Schema(
    {
      type: {
        type: String,
        required: true,
        default: "Submission",
      },
      submittable: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      submittable_type: {
        type: String,
        required: true,
      },
      assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
        required: true,
      },
      auths: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Auth",
        },
      ],
      is_submitted: {
        type: Boolean,
        default: false,
        required: false,
      },
      grade: {
        type: Number,
        required: false,
      },
      progress: {
        type: Number,
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
        crudFunnel(
          "Assignment",
          "updateOne",
          [{ _id: deleted.assignment }, { $pull: { submissions: deleted._id } }],
          deleted.assignment,
          { models: mongoose.models, pubsub, caches }
        ),
        crudFunnel(
          deleted.submittable_type,
          "updateOne",
          [{ _id: deleted.submittable }, { submission: null }],
          deleted.submittable,
          { models: mongoose.models, pubsub, caches }
        ),
        crudFunnel("Auth", "deleteMany", { _id: { $in: deleted.auths } }, deleted.auths, {
          models: mongoose.models,
          pubsub,
          caches,
        }),
      ]).then((resolved) => {
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((submissions) => {
        if (submissions.length) {
          const submissionsids = submissions.map((a) => a._id);
          const submissionsassignments = submissions.map((a) => a.assignment);
          const submissionssubmittables = submissions.map((a) => a.submittable);
          const submissionssubmittablestypes = [...new Set(submissions.map((a) => a.submittable))];
          Promise.all([
            crudFunnel(
              "Assignment",
              "updateMany",
              [{ _id: { $in: submissionsassignments } }, { $pullAll: { submissions: submissionsids } }],
              submissionsassignments,
              { models: mongoose.models, pubsub, caches }
            ),
            ...submissionssubmittablestypes.map((submissionssubmittablestype) =>
              crudFunnel(
                submissionssubmittablestype,
                "updateMany",
                [{ _id: { $in: submissionssubmittables } }, { submission: null }],
                submissionssubmittables,
                { models: mongoose.models, pubsub, caches }
              )
            ),
          ]).then((resolved) => {
            next();
          });
        } else {
          next();
        }
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
          saved.submittable_type,
          "updateOne",
          [
            {
              _id: saved.submittable,
            },
            {
              $addToSet: { submissions: saved._id },
            },
          ],
          saved.submittable,
          { models: mongoose.models, pubsub, caches }
        ).then((auth) => {
          return;
        });
      }
    });

  return Submission;
};

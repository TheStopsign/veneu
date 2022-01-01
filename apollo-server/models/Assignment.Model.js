const mongoose = require("mongoose");
const { crudFunnel } = require("../crudHandlers");

module.exports = (pubsub, caches) => {
  const Assignment = new mongoose.Schema(
    {
      type: {
        type: String,
        required: true,
        default: "Assignment",
      },
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      assignable: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      assignable_type: {
        type: String,
        required: true,
      },
      submissions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Submission",
          required: true,
        },
      ],
      points: {
        type: Number,
        required: false,
      },
      hidden_until: {
        type: Date,
        required: false,
      },
      due: {
        type: Date,
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
        crudFunnel(
          deleted.assignable_type,
          "updateOne",
          [{ _id: deleted.assignable }, { assignment: null }],
          deleted.assignable,
          { models: mongoose.models, pubsub, caches }
        ),
      ]).then((resolved) => {
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((assignments) => {
        if (assignments.length) {
          const assignablesids = assignments.map((a) => a.assignable);
          Promise.all([
            crudFunnel(
              "YTVideoStream",
              "updateMany",
              [{ _id: { $in: assignablesids } }, { assignment: null }],
              assignablesids,
              { models: mongoose.models, pubsub, caches }
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
      caches[this.type].del(this._id + "");
      this.wasNew = this.isNew;
      next();
    })
    .post("save", function () {
      let saved = this;
      if (this.wasNew) {
        Promise.all([
          crudFunnel(
            saved.assignable_type,
            "updateOne",
            [{ _id: saved.assignable }, { assignment: saved._id }],
            saved.assignable,
            { models: mongoose.models, pubsub, caches }
          ),
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
          ),
        ]).then((auth) => {});
      }
    });

  return Assignment;
};

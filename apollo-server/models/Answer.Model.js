const mongoose = require("mongoose");

module.exports = (pubsub) => {
  const Answer = new mongoose.Schema(
    {
      type: {
        type: String,
        required: true,
        default: "Answer",
      },
      submission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission",
        required: false,
      },
      question: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      question_type: {
        type: String,
        required: true,
      },
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      answer: {
        type: String,
        required: false,
      },
    },
    {
      timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
  )
    .pre("deleteOne", { document: true }, function (next) {
      Promise.all([mongoose.model("Submission").deleteOne({ submittable: this._id })]).then((resolved) => {
        next();
      });
    })
    .pre("deleteMany", function (next) {
      this.model.find(this.getFilter()).then((answers) => {
        if (answers.length) {
          const answersids = answers.map((a) => a._id);
          const answersparents = answers.map((a) => a.parent_resource);
          Promise.all([mongoose.model("Submission").deleteMany({ submittable: { $in: answers } })]).then((resolved) => {
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
      // if (this.wasNew) {
      // }
    });

  module.exports = mongoose.model("Answer", Answer);
};

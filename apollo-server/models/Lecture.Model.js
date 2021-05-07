const mongoose = require("mongoose");

const Lecture = new mongoose.Schema(
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
      default: "Lecture"
    },
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    },
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
      mongoose.model("Auth").deleteMany({ shared_resource: this._id }),
      mongoose
        .model(this.parent_resource_type)
        .updateOne({ _id: this.parent_resource }, { $pull: { lectures: this._id } })
    ]).then(next);
  })
  .pre("deleteMany", function(next) {
    this.model.find(this.getFilter()).then(lectures => {
      if (lectures.length) {
        const lecturesids = lectures.map(a => a._id);
        const lecturesparents = lectures.map(a => a.parent_resource);
        Promise.all([
          mongoose.model("Auth").deleteMany({ shared_resource: { $in: lecturesids } }),
          mongoose
            .model("Course")
            .updateMany({ _id: { $in: lecturesparents } }, { $pullAll: { lectures: lecturesids } }),
          mongoose
            .model("RegistrationSection")
            .updateMany({ _id: { $in: lecturesparents } }, { $pullAll: { lectures: lecturesids } }),
          mongoose
            .model("UserGroup")
            .updateMany({ _id: { $in: lecturesparents } }, { $pullAll: { lectures: lecturesids } })
        ]).then(resolved => {
          next();
        });
      } else {
        next();
      }
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
          shared_resource_type: "Lecture",
          user: this.creator._id,
          role: "INSTRUCTOR"
        })
        .then(done => {
          return mongoose
            .model(this.parent_resource_type)
            .updateOne({ _id: this.parent_resource }, { $addToSet: { lectures: this._id } });
        })
        .then(auth => {
          return global.pubsub.publish("AUTH_CREATED", {
            authCreated: auth
          });
        });
    }
  });

module.exports = mongoose.model("Lecture", Lecture);

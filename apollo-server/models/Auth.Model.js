const mongoose = require("mongoose");

const Auth = new mongoose.Schema(
  {
    role: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    shared_resource: mongoose.Schema.Types.ObjectId,
    shared_resource_type: String,
    type: {
      type: String,
      default: "Auth"
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
)
  .pre("deleteOne", { document: true }, function(next) {
    Promise.all([
      mongoose.model("User").updateOne({ _id: this._id }, { $pull: { auths: this._id } }),
      mongoose.model(this.shared_resource_type).updateOne({ _id: this._id }, { $pull: { auths: this._id } })
    ]).then(resolved => {
      next();
    });
  })
  .pre("deleteMany", function(next) {
    this.model.find(this.getFilter()).then(auths => {
      if (auths.length) {
        const authids = auths.map(a => a._id);
        const authusers = auths.map(a => a.user);
        const authresources = auths.map(a => a.shared_resource);
        Promise.all([
          mongoose.model("User").updateMany({ _id: { $in: authusers } }, { $pullAll: { auths: authids } }),
          mongoose
            .model(auths[0].shared_resource_type)
            .updateMany({ _id: { $in: authresources } }, { $pullAll: { auths: authids } })
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
        mongoose.model("User").updateOne({ _id: this.user }, { $addToSet: { auths: this._id } }),
        mongoose
          .model(this.shared_resource_type)
          .updateOne({ _id: this.shared_resource }, { $addToSet: { auths: this._id } })
      ]);
    }
  });

module.exports = mongoose.model("Auth", Auth);

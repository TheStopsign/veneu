const mongoose = require("mongoose");

const Checkin = new mongoose.Schema(
  {
    type: {
      type: String,
      default: "Checkin"
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    tickets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
        required: true
      }
    ]
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
)
  .pre("deleteOne", { document: true }, function(next) {
    Promise.all([
      mongoose.model("Ticket").deleteMany({ _id: { $in: this.tickets } }),
      mongoose.model("User").updateOne({ _id: this.creator }, { $pull: { checkins: this._id } })
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
      Promise.all([
        mongoose.model("User").updateOne(
          {
            _id: this.creator
          },
          {
            $addToSet: { checkins: this._id }
          }
        )
      ]).then(res => {
        return;
      });
    }
  });

module.exports = mongoose.model("Checkin", Checkin);

const mongoose = require("mongoose");

const Ticket = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true
    },
    last_name: {
      type: String,
      required: true
    },
    user: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true,
      unique: true
    },
    checkin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Checkin",
      required: true
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
)
  .pre("deleteOne", { document: true }, function(next) {
    Promise.all([mongoose.model("Checkin").updateOne({ _id: this.checkin }, { $pull: { tickets: this._id } })]).then(
      resolved => {
        next();
      }
    );
  })
  .pre("save", function(next) {
    this.wasNew = this.isNew;
    next();
  })
  .post("save", function() {
    if (this.wasNew) {
      Promise.all([
        mongoose.model("Checkin").updateOne(
          {
            _id: this.checkin
          },
          {
            $addToSet: { tickets: this._id }
          }
        )
      ]).then(res => {
        return;
      });
    }
  });

module.exports = mongoose.model("Ticket", Ticket);

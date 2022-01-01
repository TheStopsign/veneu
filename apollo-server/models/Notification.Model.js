const mongoose = require("mongoose");
const { crudFunnel } = require("../crudHandlers");

module.exports = (pubsub, caches) => {
  const Notification = new mongoose.Schema(
    {
      text: {
        type: String,
        required: true,
      },
      redirect: {
        type: String,
        required: true,
      },
      seen: {
        type: Boolean,
        required: true,
        default: false,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      type: {
        type: String,
        default: "Notification",
      },
    },
    {
      timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
  );

  return Notification;
};

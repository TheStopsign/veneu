module.exports = (pubsub, caches) => ({
  Assignment: require("./Assignment.Model")(pubsub, caches),
  Auth: require("./Auth.Model")(pubsub, caches),
  Checkin: require("./Checkin.Model")(pubsub, caches),
  Course: require("./Course.Model")(pubsub, caches),
  Lecture: require("./Lecture.Model")(pubsub, caches),
  Notification: require("./Notification.Model")(pubsub, caches),
  RegistrationSection: require("./RegistrationSection.Model")(pubsub, caches),
  Submission: require("./Submission.Model")(pubsub, caches),
  Ticket: require("./Ticket.Model")(pubsub, caches),
  User: require("./User.Model")(pubsub, caches),
  UserGroup: require("./UserGroup.Model")(pubsub, caches),
  VideoStreamPlayback: require("./VideoStreamPlayback.Model")(pubsub, caches),
  YTVideoStream: require("./YTVideoStream.Model")(pubsub, caches),
});

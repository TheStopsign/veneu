const models = require("./models");
const DataLoader = require("dataloader");

const jwt = require("jsonwebtoken");
const { model } = require("mongoose");
const getUser = async (token) =>
  jwt.verify(token, process.env.JWTAUTH_KEY, function (err, decoded) {
    return err || !decoded
      ? null
      : models.User.findOne({ _id: decoded._id }).then((user) => {
          return models.Auth.find({ _id: { $in: user._doc.auths } }).then((auths) => {
            return { ...user._doc, auths };
          });
        });
  });
const cacheKeyFn = (key) => key.toString();
const getLoaders = () => {
  return {
    Assignment: new DataLoader((keys) => models.Assignment.find({ _id: { $in: keys } }), { cacheKeyFn }),
    Auth: new DataLoader((keys) => models.Auth.find({ _id: { $in: keys } }), { cacheKeyFn }),
    Checkin: new DataLoader((keys) => models.Checkin.find({ _id: { $in: keys } }), { cacheKeyFn }),
    Course: new DataLoader((keys) => models.Course.find({ _id: { $in: keys } }), { cacheKeyFn }),
    Lecture: new DataLoader((keys) => models.Lecture.find({ _id: { $in: keys } }), { cacheKeyFn }),
    Notification: new DataLoader((keys) => models.Notification.find({ _id: { $in: keys } }), { cacheKeyFn }),
    RegistrationSection: new DataLoader((keys) => models.RegistrationSection.find({ _id: { $in: keys } }), {
      cacheKeyFn,
    }),
    Submission: new DataLoader((keys) => models.Submission.find({ _id: { $in: keys } }), { cacheKeyFn }),
    Ticket: new DataLoader((keys) => models.Ticket.find({ _id: { $in: keys } }), { cacheKeyFn }),
    User: new DataLoader((keys) => models.User.find({ _id: { $in: keys } }), { cacheKeyFn }),
    UserGroup: new DataLoader((keys) => models.UserGroup.find({ _id: { $in: keys } }), { cacheKeyFn }),
    VideoStreamPlayback: new DataLoader((keys) => models.VideoStreamPlayback.find({ _id: { $in: keys } }), {
      cacheKeyFn,
    }),
    YTVideoStream: new DataLoader((keys) => models.YTVideoStream.find({ _id: { $in: keys } }), { cacheKeyFn }),
  };
};

module.exports = async ({ req, connection }) => {
  if (connection) {
    return {
      ...connection.context,
      models,
      loaders: getLoaders(),
    };
  } else {
    const auth = (req.headers && req.headers.authorization && req.headers.authorization.split(" ")) || [];
    if (auth.length == 2 && auth[0] == "Bearer") {
      const user = await getUser(auth[1]);
      return {
        requester: user,
        models,
        loaders: getLoaders(),
      };
    } else {
      return {
        requester: null,
        models,
        loaders: getLoaders(),
      };
    }
  }
};

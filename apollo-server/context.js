const models = require("./models");

const jwt = require("jsonwebtoken");
const getUser = async token =>
  jwt.verify(token, process.env.JWTAUTH_KEY, function(err, decoded) {
    return err || !decoded
      ? null
      : models.User.findOne({ _id: decoded._id }).then(user => {
          return models.Auth.find({ _id: { $in: user._doc.auths } }).then(auths => {
            return { ...user._doc, auths };
          });
        });
  });

module.exports = async ({ req, connection }) => {
  if (connection) {
    return {
      ...connection.context,
      models
    };
  } else {
    const auth = (req.headers && req.headers.authorization && req.headers.authorization.split(" ")) || [];
    if (auth.length == 2 && auth[0] == "Bearer") {
      const user = await getUser(auth[1]);
      return { requester: user, models };
    } else {
      return { requester: null, models };
    }
  }
};

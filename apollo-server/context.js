const models = require("./models");
const modelNames = Object.keys(models);
const DataLoader = require("dataloader");

const jwt = require("jsonwebtoken");
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
const findForModel = (keys, modelName) => models[modelName].find({ _id: { $in: keys } });
const cacheKeyFn = (key) => key.toString();
const getLoaders = () => {
  var i = 0,
    len = modelNames.length,
    loaders = {};
  while (i < len) {
    let modelName = modelNames[i];
    loaders[modelName] = new DataLoader((keys) => findForModel(keys, modelName), { cacheKeyFn });
    i++;
  }
  return loaders;
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

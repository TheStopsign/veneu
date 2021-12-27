const getModels = require("./models");
const DataLoader = require("dataloader");
const jwt = require("jsonwebtoken");

const getUser = async (models, token) =>
  jwt.verify(token, process.env.JWTAUTH_KEY, function (err, decoded) {
    return err || !decoded
      ? null
      : models.User.findOne({ _id: decoded._id }).then((user) => {
          return models.Auth.find({ _id: { $in: user._doc.auths } }).then((auths) => {
            return { ...user._doc, auths };
          });
        });
  });
const findForModel = (models, keys, modelName) => models[modelName].find({ _id: { $in: keys } });
const cacheKeyFn = (key) => key.toString();
const getLoaders = (models, modelNames) => {
  var i = 0,
    len = modelNames.length,
    loaders = {};
  while (i < len) {
    let modelName = modelNames[i];
    loaders[modelName] = new DataLoader((keys) => findForModel(models, keys, modelName), { cacheKeyFn });
    i++;
  }
  return loaders;
};

module.exports = (pubsub, modelNames, models, caches) => {
  return async ({ req, connection }) => {
    let baseCtx = { models, loaders: getLoaders(models, modelNames), pubsub, caches };
    if (connection) {
      return {
        ...connection.context,
        ...baseCtx,
      };
    } else {
      const auth = (req.headers && req.headers.authorization && req.headers.authorization.split(" ")) || [];
      if (auth.length == 2 && auth[0] == "Bearer") {
        const user = await getUser(models, auth[1]);
        const auths = user.auths.filter((a) => undefined != a.role && null != a.role);
        return {
          requester: {
            ...user,
            auths,
          },
          ...baseCtx,
        };
      } else {
        return {
          requester: null,
          ...baseCtx,
        };
      }
    }
  };
};

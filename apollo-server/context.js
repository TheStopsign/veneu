const getModels = require("./models");
const DataLoader = require("dataloader");

const jwt = require("jsonwebtoken");

module.exports = (pubsub) => {
  const models = getModels(pubsub);
  const modelNames = Object.keys(models);
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
  return async ({ req, connection }) => {
    if (connection) {
      return {
        ...connection.context,
        models,
        loaders: getLoaders(),
        pubsub,
      };
    } else {
      const auth = (req.headers && req.headers.authorization && req.headers.authorization.split(" ")) || [];
      if (auth.length == 2 && auth[0] == "Bearer") {
        const user = await getUser(auth[1]);
        const auths = user.auths.filter((a) => undefined != a.role && null != a.role);
        return {
          requester: {
            ...user,
            auths,
          },
          models,
          loaders: getLoaders(),
          pubsub,
        };
      } else {
        return {
          requester: null,
          models,
          loaders: getLoaders(),
          pubsub,
        };
      }
    }
  };
};

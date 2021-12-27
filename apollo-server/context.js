const getModels = require("./models");
const DataLoader = require("dataloader");
const jwt = require("jsonwebtoken");

const getUser = async (models, { Auth: AuthsCache, User: UsersCache }, token) =>
  jwt.verify(token, process.env.JWTAUTH_KEY, async function (err, decoded) {
    if (err || !decoded) {
      return null;
    }
    let user = UsersCache.get(decoded._id + "");
    if (!user) {
      user = await models.User.findOne({ _id: decoded._id });
      UsersCache.set(decoded._id + "", user);
    }
    let auths = user._doc.auths.map((a) => AuthsCache.get(a + ""));
    if (auths.filter((a) => a == null).length) {
      auths = await models.Auth.find({ _id: { $in: user._doc.auths } });
      await auths.forEach(function (auth) {
        AuthsCache.set(auth._id + "", auth);
      });
    }
    return { ...user._doc, auths };
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
        const user = await getUser(models, caches, auth[1]);
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

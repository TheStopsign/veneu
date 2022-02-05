const ADD_TO_CACHE_FNS = ["findOne", "find"];
const REMOVE_FROM_CACHE_FNS = ["updateOne", "updateMany", "deleteOne", "deleteMany"];
const REQUIRES_PREFETCH_FNS = ["deleteOne", "deleteMany"];
const REQUIRES_REFETCH_FNS = ["updateOne", "updateMany"];
const fns = {
  crudFunnel: async (modelName, functionName, options, cacheIds, { models, pubsub, loaders, caches }) => {
    let res;
    let optionsIsArray = options instanceof Array;
    let cacheIdsIsArray = cacheIds instanceof Array;

    if (ADD_TO_CACHE_FNS.includes(functionName)) {
      let cached = cacheIdsIsArray
        ? cacheIds.map((cacheId) => caches[modelName].has(cacheId + ""))
        : [caches[modelName].has(cacheIds + "")];
      if (cached.length) {
        if (!cached.includes(false)) {
          res = cacheIdsIsArray
            ? cacheIds.map((cacheId) => caches[modelName].get(cacheId + ""))
            : caches[modelName].get(cacheIds + "");
          console.log(modelName.toUpperCase() + "(S)", cacheIds, "FETCHED FROM CACHE");
        } else if (loaders && loaders[modelName]) {
          res = cacheIdsIsArray ? await loaders[modelName].loadMany(cacheIds) : await loaders[modelName].load(cacheIds);
          console.log(modelName.toUpperCase() + "(S)", cacheIds, "FETCHED FROM DATALOADER");
          if (res && cacheIdsIsArray) {
            res = res.filter((a) => a);
            res.forEach(function (item) {
              caches[modelName].set(item._id + "", item);
            });
            console.log(modelName.toUpperCase(), cacheIds, "ADDED TO CACHE");
          } else if (res) {
            caches[modelName].set(res._id + "", res);
            console.log(modelName.toUpperCase(), cacheIds, "ADDED TO CACHE");
          }
        }
      }
    }

    if (res) {
      return res;
    }

    let prefetch;
    switch (functionName) {
      case "deleteOne":
        prefetch = await models[modelName].findOne(options);
        res = await prefetch.deleteOne().then((del) => prefetch);
        break;
      case "deleteMany":
        prefetch = await models[modelName].find(options);
        res = await models[modelName][functionName](options).then((del) => prefetch);
        break;
      default:
        res = optionsIsArray
          ? await models[modelName][functionName](...options)
          : await models[modelName][functionName](options);
        if (res && res.length && ADD_TO_CACHE_FNS.includes(functionName)) {
          res
            .filter((a) => a)
            .forEach(function (item) {
              caches[modelName].set(item._id + "", item);
            });
        }
        break;
    }

    if (REQUIRES_REFETCH_FNS.includes(functionName)) {
      res =
        optionsIsArray && cacheIdsIsArray
          ? await models[modelName].find(options[0])
          : optionsIsArray
          ? await models[modelName].findOne(options[0])
          : cacheIdsIsArray
          ? await models[modelName].find(options)
          : await models[modelName].findOne(options);
    }

    if (REMOVE_FROM_CACHE_FNS.includes(functionName)) {
      if (cacheIdsIsArray) {
        cacheIds.forEach((id) => {
          caches[modelName].del(id + "");
        });
      } else if (cacheIds) {
        caches[modelName].del(cacheIds + "");
      }
      console.log(modelName.toUpperCase() + "(S)", cacheIds, "REMOVED FROM CACHE");
    }

    switch (functionName) {
      case "create":
        console.log(modelName.toUpperCase(), "CREATED");
        await pubsub.publish(modelName.toUpperCase() + "_CREATED", {
          resource: res,
        });
        break;
      case "insertMany":
        for (let i = 0; i < res.length; i++) {
          console.log(modelName.toUpperCase(), "CREATED");
          await pubsub.publish(modelName.toUpperCase() + "_CREATED", {
            resource: res,
          });
        }
        break;
      case "updateOne":
        console.log(modelName.toUpperCase() + "(S)", cacheIds, "UPDATED");
        await pubsub.publish(modelName.toUpperCase() + "_UPDATED", {
          resource: res,
        });
        break;
      case "updateMany":
        console.log(modelName.toUpperCase() + "(S)", cacheIds, "UPDATED");
        for (let i = 0; i < res.length; i++) {
          await pubsub.publish(modelName.toUpperCase() + "_UPDATED", {
            resource: res,
          });
        }
        break;
      case "deleteOne":
        console.log(modelName.toUpperCase() + "(S)", cacheIds, "DELETED");
        await pubsub.publish(modelName.toUpperCase() + "_DELETED", {
          resource: res,
        });
        break;
      case "deleteMany":
        console.log(modelName.toUpperCase() + "(S)", cacheIds, "DELETED");
        for (let i = 0; i < res.length; i++) {
          await pubsub.publish(modelName.toUpperCase() + "_DELETED", {
            resource: res,
          });
        }
        break;
    }

    return res;
  },
  createOne: async (filters, { models, loaders, pubsub, caches }) =>
    filters && filters.type
      ? models[filters.type]
          .create(filters)
          .then((created) =>
            pubsub
              ? pubsub
                  .publish(filters.type.toUpperCase() + "_CREATED", {
                    resource: created,
                  })
                  .then((a) => created)
              : created
          )
          .catch((e) => {
            console.log("ERROR IN CREATEONE:", e);
            throw e;
          })
      : null,
  createMany: async (filters, { models, loaders, pubsub }) =>
    filters && filters instanceof Array && filters.length && filters[0].type
      ? models[filters.type]
          .insertMany(filters)
          .then((inserted) => models[filters.type].find(filters))
          .then((created) =>
            pubsub
              ? pubsub
                  .publish(filters.type.toUpperCase() + "_CREATED", {
                    resources: created,
                  })
                  .then((a) => created)
              : created
          )
          .catch((e) => {
            console.log("ERROR IN CREATEMANY:", e);
            throw e;
          })
      : null,
  readOne: async (filters, { models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type].findOne(filters).catch((e) => {
          console.log("ERROR IN READONE:", e);
          throw e;
        })
      : null,
  readMany: async (filters, { models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type].find(filters).catch((e) => {
          console.log("ERROR IN READMANY:", e);
          throw e;
        })
      : null,
  updateOne: async (filters, updates, { models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type]
          .findOneAndUpdate(filters, updates, { new: true })
          .then((updated) =>
            pubsub
              ? pubsub
                  .publish(filters.type.toUpperCase() + "_UPDATED", {
                    resource: updated,
                  })
                  .then((a) => updated)
              : updated
          )
          .catch((e) => {
            console.log("ERROR IN UPDATEONE:", e);
            throw e;
          })
      : null,
  updateMany: async (filters, updates, { models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type]
          .updateMany(filters, updates)
          .then((update) => models[filters.type].findOne(filters))
          .then((updated) =>
            pubsub
              ? pubsub
                  .publish(filters.type.toUpperCase() + "_UPDATED", {
                    resources: updated,
                  })
                  .then((a) => updated)
              : updated
          )
          .catch((e) => {
            console.log("ERROR IN UPDATEMANY:", e);
            throw e;
          })
      : null,
  deleteOne: async (filters, { models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type]
          .findOne(filters)
          .then((doc) => doc.deleteOne().then((deleted) => doc))
          .then((deleted) =>
            pubsub
              ? pubsub
                  .publish(filters.type.toUpperCase() + "_DELETED", {
                    resource: deleted,
                  })
                  .then((a) => deleted)
              : deleted
          )
          .catch((e) => {
            console.log("ERROR IN DELETEONE:", e);
            throw e;
          })
      : null,
  deleteMany: async (filters, { models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type]
          .find(filters)
          .then((docs) => docs.deleteMany().then((deleted) => docs))
          .then((deleted) =>
            pubsub
              ? pubsub
                  .publish(filters.type.toUpperCase() + "_DELETED", {
                    resources: deleted,
                  })
                  .then((a) => deleted)
              : deleted
          )
          .catch((e) => {
            console.log("ERROR IN DELETEMANY:", e);
            throw e;
          })
      : null,
};
module.exports = fns;

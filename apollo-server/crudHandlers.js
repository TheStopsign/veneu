const mongoose = require("mongoose");

const fns = {
  createOne: async (filters, { requester, models, loaders, pubsub }) =>
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
  createMany: async (filters, { requester, models, loaders, pubsub }) =>
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
  readOne: async (filters, { requester, models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type].findOne(filters).catch((e) => {
          console.log("ERROR IN READONE:", e);
          throw e;
        })
      : null,
  readMany: async (filters, { requester, models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type].find(filters).catch((e) => {
          console.log("ERROR IN READMANY:", e);
          throw e;
        })
      : null,
  updateOne: async (filters, updates, { requester, models, loaders, pubsub }) =>
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
  updateMany: async (filters, updates, { requester, models, loaders, pubsub }) =>
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
  deleteOne: async (filters, { requester, models, loaders, pubsub }) =>
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
  deleteMany: async (filters, { requester, models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type]
          .find(filters)
          .findOne(filters)
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

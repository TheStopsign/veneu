const mongoose = require("mongoose");

const fns = {
  createOne: (filters, { requester, models, loaders, pubsub }) =>
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
  createMany: (filters, { requester, models, loaders, pubsub }) =>
    filters && filters instanceof Array && filters.length && filters[0].type
      ? models[filters.type]
          .insertMany(filters)
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
  readOne: (filters, { requester, models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type].findOne(filters).catch((e) => {
          console.log("ERROR IN READONE:", e);
          throw e;
        })
      : null,
  readMany: (filters, { requester, models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type].find(filters).catch((e) => {
          console.log("ERROR IN READMANY:", e);
          throw e;
        })
      : null,
  updateOne: (filters, updates, { requester, models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type]
          .updateOne(filters, updates, { new: true })
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
  updateMany: (filters, updates, { requester, models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type]
          .updateMany(filters, updates, { new: true })
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
  deleteOne: (filters, { requester, models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type]
          .deleteOne(filters)
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
  deleteMany: (filters, { requester, models, loaders, pubsub }) =>
    filters && filters.type
      ? models[filters.type]
          .deleteMany(filters)
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

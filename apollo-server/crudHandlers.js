const mongoose = require("mongoose");

const fns = {
  createOne: (filters, pubsub) =>
    filters && filters.type
      ? mongoose
          .model(filters.type)
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
  createMany: (filters, pubsub) =>
    filters && filters instanceof Array && filters.length && filters[0].type
      ? mongoose
          .model(filters.type)
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
  readOne: (filters, method) =>
    filters && filters.type
      ? mongoose
          .model(filters.type)
          .findOne(filters)
          .catch((e) => {
            console.log("ERROR IN READONE:", e);
            throw e;
          })
      : null,
  readMany: (filters, dataLoader) =>
    filters && filters.type
      ? mongoose
          .model(filters.type)
          .find(filters)
          .catch((e) => {
            console.log("ERROR IN READMANY:", e);
            throw e;
          })
      : null,
  updateOne: (filters, updates, pubsub) =>
    filters && filters.type
      ? mongoose
          .model(filters.type)
          .updateOne(filters, updates)
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
  updateMany: (filters, updates, pubsub) =>
    filters && filters.type
      ? mongoose
          .model(filters.type)
          .updateMany(filters, updates)
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
  deleteOne: (filters, pubsub) =>
    filters && filters.type
      ? mongoose
          .model(filters.type)
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
  deleteMany: (filters, pubsub) =>
    filters && filters.type
      ? mongoose
          .model(filters.type)
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

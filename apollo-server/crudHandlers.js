const mongoose = require("mongoose");
var pubsub = null,
  modelNames = null,
  init = false;

const fns = {
  initCrudHandlers: function (options) {
    pubsub = options.pubsub;
    modelNames = options.modelNames;
    init = mongoose && pubsub && modelNames;
  },
  createOne(options) {
    if (init && options.type) {
      return mongoose
        .model(options.type)
        .create(options)
        .then((created) =>
          pubsub
            .publish(options.type.toUpperCase() + "_CREATED", {
              resource: created,
            })
            .then((a) => created)
        )
        .catch((e) => {
          console.log("ERROR:", e);
          throw e;
        });
    }
  },
  deleteOne(_id, type) {
    if (init) {
      return mongoose
        .model(type)
        .deleteOne({ _id })
        .then((removed) =>
          pubsub
            .publish(type.toUpperCase() + "_DELETED", {
              resource: removed,
            })
            .then((a) => removed)
        )
        .catch((e) => {
          console.log("ERROR:", e);
          throw e;
        });
    }
  },
};
export default fns;

const garbageTypes = {
  Course: {
    parents: ["User"],
  },
};

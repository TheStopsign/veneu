const { ForbiddenError } = require("apollo-server-express");
const { crudFunnel } = require("../crudHandlers");

const eventName = {
  LECTURE_CREATED: "LECTURE_CREATED",
  LECTURE_UPDATED: "LECTURE_UPDATED",
  LECTURE_DELETED: "LECTURE_DELETED",
};

module.exports = (pubsub, caches) => ({
  Query: {
    lecture: async (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("Lecture", "findOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
    lectures: async (parent, args, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      let ids = requester.auths.filter((a) => a.shared_resource_type == "Lecture").map((a) => a.shared_resource);
      return crudFunnel("Lecture", "find", { _id: { $in: ids } }, { models, loaders, pubsub, caches });
    },
  },
  Mutation: {
    createLecture: async (
      parent,
      { name, start, end, parent_resource, parent_resource_type },
      { requester, models, loaders, pubsub, caches },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel(
        "Lecture",
        "create",
        {
          name,
          start,
          end,
          parent_resource,
          parent_resource_type,
          creator: requester._id,
        },
        null,
        { models, loaders, pubsub, caches }
      );
    },
    updateLecture: async (parent, { _id, ...patch }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("Lecture", "updateOne", [{ _id }, patch], _id, { models, loaders, pubsub, caches });
    },
    setLectureCheckins: async (
      parent,
      { lecture: _id, checkins: newcheckins },
      { requester, models, loaders, pubsub, caches },
      info
    ) => {
      if (
        !requester ||
        (requester && !requester.auths.find((a) => ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)))
      )
        throw new ForbiddenError("Not allowed");

      return Promise.all([
        crudFunnel("Lecture", "updateOne", [{ _id }, { $addToSet: { checkins: { $each: newcheckins } } }], _id, {
          models,
          loaders,
          pubsub,
          caches,
        }),
        crudFunnel(
          "Checkin",
          "updateOne",
          [
            { _id: { $in: newcheckins } },
            {
              parent_resource: _id,
              parent_resource_type: "Lecture",
            },
          ],
          newcheckins,
          { models, loaders, pubsub, caches }
        ),
      ]).then((res) => res[0]);
    },
    deleteLecture: async (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("Lecture", "deleteOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
  },
  Subscription: {
    lectureCreated: {
      subscribe: () => pubsub.asyncIterator([eventName.LECTURE_CREATED]),
    },
    lectureUpdated: {
      subscribe: () => pubsub.asyncIterator([eventName.LECTURE_UPDATED]),
    },
    lectureDeleted: {
      subscribe: () => pubsub.asyncIterator([eventName.LECTURE_DELETED]),
    },
  },
  Lecture: {
    recording: (parent, args, { models, loaders, pubsub, caches }, info) =>
      parent.recording
        ? crudFunnel(parent.recording_type, "findOne", { _id: parent.recording }, parent.recording, {
            models,
            loaders,
            pubsub,
            caches,
          })
        : null,
    parent_resource: (parent, args, { models, loaders, pubsub, caches }, info) =>
      crudFunnel(parent.parent_resource_type, "findOne", { _id: parent.parent_resource }, parent.recording, {
        models,
        loaders,
        pubsub,
        caches,
      }),
    checkins: (parent, args, { models, loaders, pubsub, caches }, info) =>
      parent.checkins
        ? crudFunnel("Checkin", "find", { _id: { $in: parent.checkins } }, parent.checkins, {
            models,
            loaders,
            pubsub,
            caches,
          })
        : [],
  },
});

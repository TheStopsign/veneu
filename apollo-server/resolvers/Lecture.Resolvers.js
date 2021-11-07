const { AuthenticationError, ForbiddenError } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");

const eventName = {
  LECTURE_CREATED: "LECTURE_CREATED",
  LECTURE_UPDATED: "LECTURE_UPDATED",
  LECTURE_DELETED: "LECTURE_DELETED",
};

module.exports = (pubsub) => ({
  Query: {
    lecture: async (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne({ _id, type: "Lecture" }, { requester, models, loaders, pubsub });
    },
    lectures: async (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readMany(
        { auths: { $in: requester.auths.map((a) => a._id) }, type: "Lecture" },
        { requester, models, loaders, pubsub }
      );
    },
  },
  Mutation: {
    createLecture: async (
      parent,
      { name, start, end, parent_resource, parent_resource_type },
      { requester, models, loaders, pubsub },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return createOne(
        {
          name,
          start,
          end,
          parent_resource,
          parent_resource_type,
          creator: requester._id,
          type: "Lecture",
        },
        { requester, models, loaders, pubsub }
      );
    },
    updateLecture: async (parent, { _id, ...patch }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return updateOne({ _id, type: "Lecture" }, patch, { requester, models, loaders, pubsub });
    },
    setLectureCheckins: async (
      parent,
      { lecture: _id, checkins: newcheckins },
      { requester, models, loaders, pubsub },
      info
    ) => {
      if (
        !requester ||
        (requester && !requester.auths.find((a) => ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)))
      )
        throw new ForbiddenError("Not allowed");

      return [
        updateOne(
          { _id, type: "Lecture" },
          { $addToSet: { checkins: { $each: newcheckins } } },
          { requester, models, loaders, pubsub }
        ),
        updateOne(
          { _id: { $in: newcheckins }, type: "Checkin" },
          {
            parent_resource: _id,
            parent_resource_type: "Lecture",
          },
          { requester, models, loaders, pubsub }
        ),
      ][0];
    },
    deleteLecture: async (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return deleteOne({ _id, type: "Lecture" }, { requester, models, loaders, pubsub });
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
    recording: (parent, args, { loaders }, info) =>
      parent.recording ? loaders[parent.recording_type].load(parent.recording) : null,
    parent_resource: (parent, args, { loaders }, info) =>
      loaders[parent.parent_resource_type].load(parent.parent_resource),
    checkins: (parent, args, { loaders: { Checkin } }, info) =>
      parent.checkins ? Checkin.loadMany(parent.checkins) : [],
  },
});

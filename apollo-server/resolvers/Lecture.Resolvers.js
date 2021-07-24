const { AuthenticationError, ForbiddenError } = require("apollo-server-express");

const eventName = {
  LECTURE_CREATED: "LECTURE_CREATED",
  LECTURE_UPDATED: "LECTURE_UPDATED",
  LECTURE_DELETED: "LECTURE_DELETED",
};

module.exports = {
  Query: {
    lecture: (parent, { _id }, { requester, loaders: { Lecture } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Lecture.load(_id);
    },
    lectures: (parent, args, { requester, models: { Lecture } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Lecture.find();
    },
  },
  Mutation: {
    createLecture: (
      parent,
      { name, start, end, parent_resource, parent_resource_type },
      { requester, models: { Lecture } },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Lecture.create({
        name,
        start,
        end,
        parent_resource,
        parent_resource_type,
        creator: requester._id,
      }).then((lecture) => {
        return global.pubsub.publish(eventName.LECTURE_CREATED, { lectureCreated: lecture }).then((done) => {
          return lecture;
        });
      });
    },
    updateLecture(parent, { _id, ...patch }, { requester, models: { Lecture } }, info) {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Lecture.findOneAndUpdate({ _id }, patch, { new: true }).then((lecture) => {
        return global.pubsub.publish(eventName.LECTURE_UPDATED, { lectureUpdated: lecture }).then((done) => {
          return lecture;
        });
      });
    },
    setLectureCheckins(parent, { lecture: _id, checkins: newcheckins }, { requester, models: { Lecture } }, info) {
      if (
        !requester ||
        (requester && !requester.auths.find((a) => ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)))
      )
        throw new ForbiddenError("Not allowed");
      return Lecture.findOneAndUpdate({ _id }, { $addToSet: { checkins: { $each: newcheckins } } }, { new: true }).then(
        (lecture) => {
          return global.pubsub.publish(eventName.LECTURE_UPDATED, { lectureUpdated: lecture }).then((done) => {
            return lecture;
          });
        }
      );
    },
    deleteLecture: (parent, { _id }, { requester, models: { Lecture } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Lecture.findOne({ _id })
        .then((lecture) => lecture.deleteOne())
        .then((lecture) => {
          return global.pubsub.publish(eventName.LECTURE_DELETED, { lectureDeleted: lecture }).then((done) => {
            return lecture;
          });
        });
    },
  },
  Subscription: {
    lectureCreated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.LECTURE_CREATED]),
    },
    lectureUpdated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.LECTURE_UPDATED]),
    },
    lectureDeleted: {
      subscribe: () => global.pubsub.asyncIterator([eventName.LECTURE_DELETED]),
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
};

const { ForbiddenError } = require("apollo-server-express");

const eventName = {
  COURSE_CREATED: "COURSE_CREATED",
  COURSE_UPDATED: "COURSE_UPDATED",
  COURSE_DELETED: "COURSE_DELETED",
};

module.exports = {
  Query: {
    course: (parent, { _id }, { requester, loaders: { Course } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Course.load(_id);
    },
    courses: (parent, args, { requester, models: { Course, Auth } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Auth.find({ user: requester._id }).then((auths) => {
        return Course.find({ auths: { $in: auths } });
      });
    },
  },
  Mutation: {
    createCourse: (parent, args, { requester, models: { Course } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Course.create({ creator: requester._id, parent_resource: null, parent_resource_type: null, ...args }).then(
        (course) => {
          return global.pubsub.publish(eventName.COURSE_CREATED, { courseCreated: course }).then((done) => {
            return course;
          });
        }
      );
    },
    updateCourse(parent, { _id, ...patch }, { requester, models: { Course } }, info) {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Course.findOneAndUpdate({ _id: _id }, patch, {
        new: true,
      }).then((course) => {
        return global.pubsub
          .publish(eventName.COURSE_UPDATED, {
            courseUpdated: course,
          })
          .then((done) => {
            return course;
          });
      });
    },
    deleteCourse: (parent, { _id }, { requester, models: { Course } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Course.findOne({ _id })
        .then((course) => course.deleteOne())
        .then((course) => {
          return global.pubsub
            .publish(eventName.COURSE_DELETED, {
              courseDeleted: course,
            })
            .then((done) => {
              return course;
            });
        });
    },
  },
  Subscription: {
    courseCreated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.COURSE_CREATED]),
    },
    courseUpdated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.COURSE_UPDATED]),
    },
    courseDeleted: {
      subscribe: () => global.pubsub.asyncIterator([eventName.COURSE_DELETED]),
    },
  },
  Course: {
    user_groups: (parent, args, { loaders: { UserGroup } }, info) => UserGroup.loadMany(parent.user_groups),
    registration_sections: (parent, args, { loaders: { RegistrationSection } }, info) =>
      RegistrationSection.loadMany(parent.registration_sections),
    lectures: (parent, args, { loaders: { Lecture } }, info) => Lecture.loadMany(parent.lectures),
  },
};

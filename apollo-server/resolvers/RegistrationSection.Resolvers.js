const { AuthenticationError, ForbiddenError } = require("apollo-server-express");

const eventName = {
  REGISTRATIONSECTION_CREATED: "REGISTRATIONSECTION_CREATED",
  REGISTRATIONSECTION_UPDATED: "REGISTRATIONSECTION_UPDATED",
  REGISTRATIONSECTION_DELETED: "REGISTRATIONSECTION_DELETED"
};

module.exports = {
  Query: {
    registrationSection: (parent, { _id }, { requester, models: { RegistrationSection } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return RegistrationSection.findById({ _id: _id });
    },
    registrationSections: (parent, args, { requester, models: { RegistrationSection, Auth } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Auth.find({ user: requester._id }).then(auths => {
        return RegistrationSection.find({ auths: { $in: auths } });
      });
    }
  },
  Mutation: {
    createRegistrationSection: (
      parent,
      { name, course, ...args },
      { requester, models: { RegistrationSection } },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return RegistrationSection.create({
        name,
        creator: requester._id,
        course,
        parent_resource: course,
        parent_resource_type: "Course",
        ...args
      }).then(registrationSection => {
        return global.pubsub
          .publish(eventName.COURSE_CREATED, { registrationSectionCreated: registrationSection })
          .then(done => {
            return registrationSection;
          });
      });
    },
    updateRegistrationSection(parent, { _id, ...patch }, { requester, models: { RegistrationSection } }, info) {
      if (!requester) throw new ForbiddenError("Not allowed");
      return RegistrationSection.findOneAndUpdate({ _id: _id }, patch, { new: true }).then(registrationSection => {
        return global.pubsub
          .publish(eventName.REGISTRATIONSECTION_UPDATED, { registrationSectionUpdated: registrationSection })
          .then(done => {
            return registrationSection;
          });
      });
    },
    deleteRegistrationSection: (parent, { _id }, { requester, models: { RegistrationSection } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return RegistrationSection.findOne({ _id })
        .then(registrationSection => registrationSection.deleteOne())
        .then(registrationSection => {
          return global.pubsub
            .publish(eventName.REGISTRATIONSECTION_DELETED, { registrationSectionDeleted: registrationSection })
            .then(done => {
              return registrationSection;
            });
        });
    }
  },
  Subscription: {
    registrationSectionCreated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.REGISTRATIONSECTION_CREATED])
    },
    registrationSectionUpdated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.REGISTRATIONSECTION_UPDATED])
    },
    registrationSectionDeleted: {
      subscribe: () => global.pubsub.asyncIterator([eventName.REGISTRATIONSECTION_DELETED])
    }
  },
  RegistrationSection: {
    course: (parent, args, { models: { Course } }, info) => {
      return Course.findById({ _id: parent.course });
    },
    user_groups: (parent, args, { models: { UserGroup } }, info) => {
      return UserGroup.find({ _id: { $in: parent.user_groups } });
    },
    lectures: (parent, args, { models: { Lecture } }, info) => {
      return Lecture.find({ _id: { $in: parent.lectures } });
    }
  }
};

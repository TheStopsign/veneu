const { ForbiddenError, withFilter } = require("apollo-server-express");
const { readOne, readMany } = require("../crudHandlers");

const ParentResourceResolvers = {
  ParentResource: {
    __resolveType: async (parentResource) => parentResource.type,
  },
};

const SharedResourceResolvers = {
  SharedResource: {
    __resolveType: async (sharedResource) => sharedResource.type,
    parent_resource: async (parent, args, { requester, models, loaders, pubsub }, info) => {
      return parent.parent_resource
        ? readOne(
            { _id: parent.parent_resource, type: parent.parent_resource_type },
            { requester, models, loaders, pubsub }
          )
        : null;
    },
    auths: async (parent, args, { requester, models, loaders, pubsub }, info) =>
      readMany({ _id: { $in: parent.auths }, type: "Auth" }, { requester, models, loaders, pubsub }),
  },
};

const CalendarizableEventResolvers = {
  Query: {
    calendarEvents: async (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readMany(
        {
          _id: {
            $in: requester.auths.filter((a) => a.shared_resource_type == "Lecture").map((a) => a.shared_resource),
          },
          type: "Lecture",
        },
        { requester, models, loaders, pubsub }
      );
    },
  },
  CalendarizableEvent: {
    __resolveType: async (CalendarizableEvent) => CalendarizableEvent.type,
  },
};

const AssignableResolvers = {
  Assignable: {
    __resolveType: async (assignable) => assignable.type,
  },
};

const SubmittableResolvers = {
  Submittable: {
    __resolveType: async (submittable) => submittable.type,
  },
};

const SearchResultResolvers = {
  SearchResult: {
    __resolveType: async (searchResult) => searchResult.type,
  },
};

const VideoStreamResolvers = {
  VideoStream: {
    __resolveType: async (videoStream) => videoStream.type,
  },
};

const getResolvers = (pubsub) => [
  ParentResourceResolvers,
  SharedResourceResolvers,
  CalendarizableEventResolvers,
  AssignableResolvers,
  SubmittableResolvers,
  SearchResultResolvers,
  VideoStreamResolvers,
  require("./Auth.Resolvers")(pubsub),
  require("./Checkin.Resolvers")(pubsub),
  require("./Course.Resolvers")(pubsub),
  require("./Lecture.Resolvers")(pubsub),
  require("./Notification.Resolvers")(pubsub),
  require("./RegistrationSection.Resolvers")(pubsub),
  require("./Ticket.Resolvers")(pubsub),
  require("./User.Resolvers")(pubsub),
  require("./UserGroup.Resolvers")(pubsub),
  require("./VideoStreamPlayback.Resolvers")(pubsub),
  require("./YTVideoStream.Resolvers")(pubsub),
];

module.exports = getResolvers;

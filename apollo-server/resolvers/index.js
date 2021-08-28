const { ForbiddenError, withFilter } = require("apollo-server-express");
const { readOne } = require("../crudHandlers");

const ParentResourceResolvers = {
  ParentResource: {
    __resolveType: (parentResource) => parentResource.type,
  },
};

const SharedResourceResolvers = {
  SharedResource: {
    __resolveType: (sharedResource) => sharedResource.type,
    parent_resource: (parent, args, { requester, models, loaders, pubsub }, info) => {
      return parent.parent_resource
        ? readOne(
            { _id: parent.parent_resource, type: parent.parent_resource_type },
            { requester, models, loaders, pubsub }
          )
        : null;
    },
    auths: (parent, args, { requester, models, loaders, pubsub }, info) =>
      readOne({ _id: { $in: parent.auths }, type: "Auth" }, { requester, models, loaders, pubsub }),
  },
};

const CalendarizableEventResolvers = {
  Query: {
    calendarEvents: (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne(
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
    __resolveType: (CalendarizableEvent) => CalendarizableEvent.type,
  },
};

const AssignableResolvers = {
  Assignable: {
    __resolveType: (assignable) => assignable.type,
  },
};

const SubmittableResolvers = {
  Submittable: {
    __resolveType: (submittable) => submittable.type,
  },
};

const SearchResultResolvers = {
  SearchResult: {
    __resolveType: (searchResult) => searchResult.type,
  },
};

const VideoStreamResolvers = {
  VideoStream: {
    __resolveType: (videoStream) => videoStream.type,
  },
};

const resolvers = [
  ParentResourceResolvers,
  SharedResourceResolvers,
  CalendarizableEventResolvers,
  AssignableResolvers,
  SubmittableResolvers,
  SearchResultResolvers,
  VideoStreamResolvers,
  require("./Auth.Resolvers"),
  require("./Checkin.Resolvers"),
  require("./Course.Resolvers"),
  require("./Lecture.Resolvers"),
  require("./Notification.Resolvers"),
  require("./RegistrationSection.Resolvers"),
  require("./Ticket.Resolvers"),
  require("./User.Resolvers"),
  require("./UserGroup.Resolvers"),
  require("./VideoStreamPlayback.Resolvers"),
  require("./YTVideoStream.Resolvers"),
];

module.exports = resolvers;

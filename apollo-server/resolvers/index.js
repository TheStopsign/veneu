const { ForbiddenError, withFilter } = require("apollo-server-express");
const { readOne, readMany, crudFunnel } = require("../crudHandlers");
const { flatten } = require("../generics");

const ParentResourceResolvers = {
  ParentResource: {
    __resolveType: ({ type }) => type,
  },
};

const SharedResourceResolvers = {
  SharedResource: {
    __resolveType: async ({ type }) => type,
    parent_resource: async (parent, args, { requester, models, loaders, pubsub, caches }, info) => {
      return parent.parent_resource
        ? crudFunnel(parent.parent_resource_type, "findOne", { _id: parent.parent_resource }, parent.parent_resource, {
            models,
            loaders,
            pubsub,
            caches,
          })
        : null;
    },
    auths: async (parent, args, { requester, models, loaders, pubsub, caches }, info) =>
      crudFunnel("Auth", "find", { _id: { $in: parent.auths } }, parent.auths, { models, loaders, pubsub, caches }),
  },
};

const CalendarizableEventResolvers = {
  Query: {
    calendarEvents: async (parent, args, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      let ids = requester.auths.filter((a) => a.shared_resource_type == "Lecture").map((a) => a.shared_resource);
      return crudFunnel(
        "Lecture",
        "find",
        {
          _id: {
            $in: ids,
          },
        },
        ids,
        { models, loaders, pubsub, caches }
      );
    },
  },
  CalendarizableEvent: {
    __resolveType: async ({ type }) => type,
  },
};

const AssignableResolvers = {
  Query: {
    assignables: async (parent, args, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      let ytvideostreamAuthIds = requester.auths
        .filter((a) => a.shared_resource_type == "YTVideoStream")
        .map((a) => a.shared_resource);
      return Promise.all([
        crudFunnel("YTVideoStream", "find", { _id: { $in: ytvideostreamAuthIds } }, ytvideostreamAuthIds, {
          models,
          loaders,
          pubsub,
          caches,
        }),
      ]).then((resolved) => flatten(resolved));
    },
  },
  Assignable: {
    assignment: async (parent, args, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("Assignment", "find", { _id: parent.assignment }, parent.assignment, {
        models,
        loaders,
        pubsub,
        caches,
      });
    },
    __resolveType: async ({ type }) => type,
  },
};

const SubmittableResolvers = {
  Submittable: {
    __resolveType: ({ type }) => type,
  },
};

const SearchResultResolvers = {
  SearchResult: {
    __resolveType: async ({ type }) => type,
  },
};

const VideoStreamResolvers = {
  VideoStream: {
    __resolveType: async ({ type }) => type,
  },
};

const getResolvers = (pubsub, caches) => [
  ParentResourceResolvers,
  SharedResourceResolvers,
  CalendarizableEventResolvers,
  AssignableResolvers,
  SubmittableResolvers,
  SearchResultResolvers,
  VideoStreamResolvers,
  require("./Assignment.Resolvers")(pubsub, caches),
  require("./Auth.Resolvers")(pubsub, caches),
  require("./Checkin.Resolvers")(pubsub, caches),
  require("./Course.Resolvers")(pubsub, caches),
  require("./Lecture.Resolvers")(pubsub, caches),
  require("./Notification.Resolvers")(pubsub, caches),
  require("./RegistrationSection.Resolvers")(pubsub, caches),
  require("./Ticket.Resolvers")(pubsub, caches),
  require("./User.Resolvers")(pubsub, caches),
  require("./UserGroup.Resolvers")(pubsub, caches),
  require("./VideoStreamPlayback.Resolvers")(pubsub, caches),
  require("./YTVideoStream.Resolvers")(pubsub, caches),
];

module.exports = getResolvers;

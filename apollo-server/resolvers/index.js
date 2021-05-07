const { ForbiddenError, withFilter } = require("apollo-server-express");

const ParentResourceResolvers = {
  ParentResource: {
    __resolveType: parentResource => parentResource.type
  }
};

const SharedResourceResolvers = {
  SharedResource: {
    __resolveType: sharedResource => sharedResource.type,
    parent_resource: (parent, args, { models }, info) => {
      return parent.parent_resource
        ? models[parent.parent_resource_type].findOne({ _id: parent.parent_resource })
        : null;
    },
    auths: (parent, args, { models: { Auth } }, info) => Auth.find({ _id: { $in: parent.auths } })
  }
};

const CalendarizableEventResolvers = {
  Query: {
    calendarEvents: (parent, args, { requester, models: { Lecture } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Lecture.find({
        _id: { $in: requester.auths.filter(a => a.shared_resource_type == "Lecture").map(a => a.shared_resource) }
      });
    }
  },
  CalendarizableEvent: {
    __resolveType: CalendarizableEvent => CalendarizableEvent.type
  }
};

const CalendarDeadlineResolvers = {
  CalendarDeadline: {
    __resolveType: calendarDeadline => calendarDeadline.type
  }
};

const SearchResultResolvers = {
  SearchResult: {
    __resolveType: searchResult => searchResult.type
  }
};

module.exports = [
  ParentResourceResolvers,
  SharedResourceResolvers,
  CalendarizableEventResolvers,
  CalendarDeadlineResolvers,
  SearchResultResolvers,
  require("./Auth.Resolvers"),
  require("./Checkin.Resolvers"),
  require("./Course.Resolvers"),
  require("./Lecture.Resolvers"),
  require("./Notification.Resolvers"),
  require("./RegistrationSection.Resolvers"),
  require("./Ticket.Resolvers"),
  require("./User.Resolvers"),
  require("./UserGroup.Resolvers")
];

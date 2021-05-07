const { gql } = require("apollo-server-express");

const linkSchema = gql`
  # directive @auth(requires: Role!) on OBJECT | FIELD_DEFINITION

  enum Role {
    ADMIN
    INSTRUCTOR
    TEACHING_ASSISTANT
    STUDENT
    GUEST
    UNKNOWN
  }

  union ParentResource = User | Course | RegistrationSection | UserGroup | Lecture

  interface SharedResource {
    _id: ID!
    creator: User!
    auths: [Auth!]!
    name: String!
    type: String!
    parent_resource: ParentResource
    parent_resource_type: String
  }

  interface CalendarizableEvent {
    _id: ID!
    name: String!
    start: Date!
    end: Date!
    type: String!
  }

  type CalendarEvent {
    name: String!
    start: Date!
    end: Date!
  }

  input CalendarEventInput {
    name: String!
    start: Date!
    end: Date!
  }

  enum WeekDay {
    MONDAY
    TUESDAY
    WEDNESDAY
    THURSDAY
    FRIDAY
    SATURDAY
    SUNDAY
  }

  type WeekDayEvent {
    weekday: WeekDay!
    event: CalendarEvent!
  }

  input WeekDayEventInput {
    weekday: WeekDay!
    event: CalendarEventInput!
  }

  interface CalendarDeadline {
    _id: ID!
    due: Date!
    type: String!
  }

  union SearchResult = User | Course | UserGroup

  scalar Date

  type Query {
    _: Boolean
    calendarEvents: [CalendarizableEvent!]!
  }
  type Mutation {
    _: Boolean
  }
  type Subscription {
    _: Boolean
  }
`;

module.exports = [
  linkSchema,
  require("./Auth.Schema"),
  require("./Checkin.Schema"),
  require("./Course.Schema"),
  require("./Lecture.Schema"),
  require("./Notification.Schema"),
  require("./RegistrationSection.Schema"),
  require("./Ticket.Schema"),
  require("./User.Schema"),
  require("./UserGroup.Schema")
];

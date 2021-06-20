const { gql } = require("apollo-server-express");

const linkSchema = gql`
  # directive @auth(requires: Role!) on OBJECT | FIELD_DEFINITION

  scalar Date

  enum Role {
    ADMIN
    INSTRUCTOR
    TEACHING_ASSISTANT
    STUDENT
    GUEST
    UNKNOWN
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

  union ParentResource = User | Course | RegistrationSection | UserGroup | Lecture
  union SearchResult = User | Course | UserGroup | RegistrationSection | Lecture

  interface Assignable {
    _id: ID!
    type: String!
    assignment: Assignment
  }

  interface Submittable {
    _id: ID!
    type: String!
    submission: Submission
    created_at: Date!
    updated_at: Date!
  }

  interface VideoStream implements Assignable {
    _id: ID!
    type: String!
    assignment: Assignment
    url: String!
    duration: Int!
  }

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

  input CalendarEventInput {
    name: String!
    start: Date!
    end: Date!
  }

  input WeekDayEventInput {
    weekday: WeekDay!
    event: CalendarEventInput!
  }

  type CalendarEvent {
    name: String!
    start: Date!
    end: Date!
  }

  type WeekDayEvent {
    weekday: WeekDay!
    event: CalendarEvent!
  }

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
  require("./Assignment.Schema"),
  require("./Auth.Schema"),
  require("./Checkin.Schema"),
  require("./Course.Schema"),
  require("./Lecture.Schema"),
  require("./Notification.Schema"),
  require("./RegistrationSection.Schema"),
  require("./Submission.Schema"),
  require("./Ticket.Schema"),
  require("./User.Schema"),
  require("./UserGroup.Schema"),
  require("./VideoStreamPlayback.Schema"),
  require("./YTVideoStream.Schema")
];

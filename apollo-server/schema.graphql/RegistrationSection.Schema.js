const { gql } = require("apollo-server-express");

module.exports = gql`
  type RegistrationSection implements SharedResource {
    _id: ID!
    name: String!
    creator: User!
    type: String!
    course: Course!
    auths: [Auth!]!
    user_groups: [UserGroup!]!
    lectures: [Lecture!]!
    meeting_times: [WeekDayEvent!]!
    parent_resource: ParentResource!
    parent_resource_type: String!
  }

  extend type Query {
    registrationSection(_id: ID!): RegistrationSection!
    registrationSections: [RegistrationSection!]!
  }

  extend type Mutation {
    createRegistrationSection(name: String!, course: ID!, meeting_times: [WeekDayEventInput]): RegistrationSection!
    updateRegistrationSection(_id: ID!, name: String): RegistrationSection!
    deleteRegistrationSection(_id: ID!): RegistrationSection!
  }

  extend type Subscription {
    registrationSectionCreated: RegistrationSection!
    registrationSectionUpdated: RegistrationSection!
    registrationSectionDeleted: RegistrationSection!
  }
`;

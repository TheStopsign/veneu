const { gql } = require("apollo-server-express");

module.exports = gql`
  type Lecture implements SharedResource & CalendarizableEvent {
    _id: ID!
    name: String!
    creator: User!
    type: String!
    auths: [Auth!]!
    start: Date!
    end: Date!
    parent_resource: ParentResource!
    parent_resource_type: String!
  }

  extend type Query {
    lecture(_id: ID!): Lecture!
    lectures: [Lecture!]!
  }

  extend type Mutation {
    createLecture(
      name: String!
      start: Date!
      end: Date!
      parent_resource: ID!
      parent_resource_type: String!
    ): Lecture!
    updateLecture(_id: ID!, name: String, start: Date, end: Date): Lecture!
    deleteLecture(_id: ID!): Lecture!
  }

  extend type Subscription {
    lectureCreated: Lecture!
    lectureUpdated: Lecture!
    lectureDeleted: Lecture!
  }
`;

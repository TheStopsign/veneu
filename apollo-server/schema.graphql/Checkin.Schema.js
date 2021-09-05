const { gql } = require("apollo-server-express");

module.exports = gql`
  type Checkin implements SharedResource {
    _id: ID!
    auths: [Auth!]!
    creator: User!
    name: String!
    type: String!
    parent_resource: ParentResource
    parent_resource_type: String
    tickets: [Ticket!]!
    created_at: Date
  }

  extend type Query {
    checkin(_id: ID!): Checkin!
    checkins: [Checkin!]!
  }

  extend type Mutation {
    createCheckin: Checkin!
    deleteCheckin(_id: ID!): Checkin!
  }

  extend type Subscription {
    checkinCreated: Checkin!
    checkinDeleted: Checkin!
  }
`;

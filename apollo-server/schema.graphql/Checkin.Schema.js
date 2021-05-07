const { gql } = require("apollo-server-express");

module.exports = gql`
  type Checkin {
    _id: ID!
    type: String!
    creator: User!
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

const { gql } = require("apollo-server-express");

module.exports = gql`
  type Ticket {
    _id: ID!
    type: String!
    code: String!
    user: ID!
    email: String!
    checkin: Checkin!
    created_at: Date!
  }

  input TicketInput {
    code: String!
    user: ID!
    email: String!
    checkin: ID!
  }

  extend type Query {
    ticket(_id: ID!): Ticket!
    tickets: [Ticket]!
  }

  extend type Mutation {
    claimTicket(code: String!, user: ID!, email: String!, checkin: ID!): Ticket!
    approveTicket(code: String!, user: ID!, email: String!, checkin: ID!): Ticket!
    reserveTicket(checkin: ID!, tickets: [TicketInput]!): [Ticket]!
  }

  extend type Subscription {
    claimedTicket(code: String!): Ticket!
    approvedTicket(user: ID!): Ticket!
    reservedTicket(checkin: ID!): [Ticket]!
  }
`;

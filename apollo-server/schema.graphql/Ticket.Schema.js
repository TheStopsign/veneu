const { gql } = require("apollo-server-express");

module.exports = gql`
  type Ticket {
    _id: ID!
    code: String!
    user: ID!
    first_name: String!
    last_name: String!
    checkin: Checkin!
  }
  input TicketInput {
    code: String!
    user: ID!
    first_name: String!
    last_name: String!
    checkin: ID!
  }

  extend type Query {
    ticket(_id: ID!): Ticket!
    tickets: [Ticket!]!
  }

  extend type Mutation {
    claimTicket(code: String!, user: ID!, first_name: String!, last_name: String!, checkin: ID!): Ticket!
    approveTicket(code: String!, user: ID!, first_name: String!, last_name: String!, checkin: ID!): Ticket!
    reserveTicket(host: ID!, tickets: [TicketInput!]!): [Ticket!]!
  }

  extend type Subscription {
    claimedTicket(code: String!): Ticket!
    approvedTicket(user: ID!): Ticket!
    reservedTicket(host: ID!): [Ticket!]!
  }
`;

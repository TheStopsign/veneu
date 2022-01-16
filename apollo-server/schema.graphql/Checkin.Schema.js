const { gql } = require("apollo-server-express");

module.exports = gql`
  type Checkin implements SharedResource {
    _id: ID!
    auths: [Auth]!
    creator: User!
    name: String!
    description: String
    type: String!
    parent_resource: ParentResource
    parent_resource_type: String

    """
    Whether users who aren't logged-in can be given Tickets
    """
    ticketing_requires_authentication: Boolean

    """
    Whether users without explicit permission can be given Tickets
    """
    ticketing_requires_authorization: Boolean

    """
    Whether the same user can be given multiple Tickets
    """
    ticketing_allows_duplicates: Boolean
  }

  extend type Checkin {
    tickets: [Ticket]!
    created_at: Date
  }

  extend type Query {
    checkin(_id: ID!): Checkin!
    checkins: [Checkin]!
    receipt(_id: ID!, email: String!): Ticket
  }

  extend type Mutation {
    createCheckin(
      name: String!
      description: String
      parent_resource: ID
      parent_resource_type: String
      ticketing_requires_authentication: Boolean
      ticketing_requires_authorization: Boolean
      ticketing_allows_duplicates: Boolean
    ): Checkin!
    deleteCheckin(_id: ID!): Checkin!
  }

  extend type Subscription {
    checkinCreated: Checkin!
    checkinDeleted: Checkin!
  }
`;

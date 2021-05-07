const { gql } = require("apollo-server-express");

module.exports = gql`
  type Auth {
    _id: ID!
    user: User
    shared_resource: SharedResource!
    shared_resource_type: String!
    role: Role
  }

  extend type Query {
    auth(_id: ID!): Auth!
    auths(shared_resource: ID): [Auth!]!
  }

  extend type Mutation {
    createAuth(user: String, role: Role!, shared_resource: ID!, shared_resource_type: String!): Auth!
    updateAuth(_id: ID!, role: Role, user: ID): Auth!
    deleteAuth(_id: ID!): Auth!
  }

  extend type Subscription {
    authCreated(user: ID!): Auth!
    authUpdated: Auth!
    authDeleted: Auth!
  }
`;

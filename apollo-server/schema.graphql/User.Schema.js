const { gql } = require("apollo-server-express");

module.exports = gql`
  type User {
    _id: ID!
    first_name: String!
    last_name: String!
    name: String
    email: String!
    password: String
    auths: [Auth!]!
    notifications: [Notification!]!
    type: String!
    checkins: [Checkin!]!
    access_code: String
    active: Boolean!
  }

  extend type Query {
    user(_id: ID!): User!
    users: [User!]!
    me: User
  }

  extend type Mutation {
    createUser(email: String!): User!
    updateUser(_id: ID!, first_name: String, last_name: String, email: String): User!
    deleteUser(_id: ID!): User!
    login(email: String!, password: String!): String!
    firstLogin(access_code: String!, first_name: String!, last_name: String!, password: String!): Boolean!
  }

  extend type Subscription {
    userCreated: User!
    userUpdated: User!
    userDeleted: User!
  }
`;

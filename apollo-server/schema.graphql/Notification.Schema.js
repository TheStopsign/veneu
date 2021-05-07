const { gql } = require("apollo-server-express");

module.exports = gql`
  type Notification {
    _id: ID!
    text: String!
    redirect: String!
    user: User!
    seen: Boolean!
  }

  extend type Query {
    notification(_id: ID!): Notification!
    notifications: [Notification!]!
  }

  extend type Mutation {
    createNotification(text: String!, redirect: String!, user: ID!): Notification!
    updateNotification(_id: ID!, seen: Boolean!): Notification!
    deleteNotification(_id: ID!): Notification!
  }

  extend type Subscription {
    notificationCreated: Notification!
    notificationUpdated: Notification!
    notificationDeleted: Notification!
  }
`;

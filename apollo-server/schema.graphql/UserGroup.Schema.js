const { gql } = require("apollo-server-express");

module.exports = gql`
  type UserGroup implements SharedResource {
    _id: ID!
    name: String!
    creator: User!
    type: String!
    auths: [Auth!]!
    user_groups: [UserGroup!]!
    lectures: [Lecture!]!
    parent_resource: ParentResource!
    parent_resource_type: String!
  }

  extend type Query {
    userGroup(_id: ID!): UserGroup!
    userGroups: [UserGroup!]!
  }

  extend type Mutation {
    createUserGroup(name: String!, parent_resource: ID!, parent_resource_type: String!): UserGroup!
    updateUserGroup(_id: ID!, name: String): UserGroup!
    deleteUserGroup(_id: ID!): UserGroup!
  }

  extend type Subscription {
    userGroupCreated: UserGroup!
    userGroupUpdated: UserGroup!
    userGroupDeleted: UserGroup!
  }
`;

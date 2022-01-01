const { gql } = require("apollo-server-express");

module.exports = gql`
  type Assignment implements SharedResource {
    _id: ID!
    creator: User!
    auths: [Auth]!
    name: String!
    type: String!
    parent_resource: ParentResource
    parent_resource_type: String
  }

  extend type Assignment {
    assignable: Assignable!
    assignable_type: String!
    submissions: [Submission]!
    points: Float
    hidden_until: Date
    due: Date!
  }

  extend type Query {
    assignment(_id: ID!): Assignment!
    assignments: [Assignment]!
  }

  extend type Mutation {
    createAssignment(
      assignable: ID!
      assignable_type: String!
      points: Float
      hidden_until: Date
      due: Date!
    ): Assignment!
    deleteAssignment(_id: ID!): Assignment
  }
`;

const { gql } = require("apollo-server-express");

module.exports = gql`
  type Assignment {
    _id: ID!
    type: String!
    assignable: Assignable!
    assignable_type: String!
    submissions: [Submission!]!
    points: Int
    created_at: Date!
    updated_at: Date!
  }

  extend type Query {
    assignment(_id: ID!): Assignment!
    assignments: [Assignment!]!
  }

  extend type Mutation {
    createAssignment(assignable: ID!, assignable_type: String!, submittable: ID!): Assignment!
    deleteAssignment(_id: ID!): Assignment
  }
`;

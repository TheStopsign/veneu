const { gql } = require("apollo-server-express");

module.exports = gql`
  type Submission {
    _id: ID!
    type: String!
    submittable: Submittable!
    submittable_type: String!
    assignment: Assignment!
    is_submitted: Boolean
    grade: Float
    progress: Float
    created_at: Date!
    updated_at: Date!
  }

  extend type Query {
    submission(_id: ID!): Submission!
    submissions: [Submission!]!
  }

  extend type Mutation {
    createSubmission(submittable: ID!, submittable_type: String!, assignment: ID!): Submission!
    deleteSubmission(_id: ID!): Submission!
  }
`;

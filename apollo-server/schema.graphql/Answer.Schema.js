const { gql } = require("apollo-server-express");

module.exports = gql`
  type Answer implements Submittable {
    _id: ID!
    type: String!
    submission: Submission
    created_at: Date!
    updated_at: Date!
  }

  extend type Answer {
    answer: String
    question: Question!
    question_type: String!
  }

  extend type Query {
    answer(_id: ID!): Answer!
    answers: [Answer!]!
  }

  extend type Mutation {
    createAnswer(question: ID!, question_type: String!, answer: String): Answer!
  }

  extend type Subscription {
    answerCreated: Answer!
    answerUpdated: Answer!
    answerDeleted: Answer!
  }
`;

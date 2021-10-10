const { gql } = require("apollo-server-express");

module.exports = gql`
  type MultipleChoice implements Question & Assignable {
    _id: ID!
    type: String!
    question: String!
    answers: [Answer]
    assignment: Assignment
  }

  extend type MultipleChoice {
    choices: [String!]!
  }

  extend type Query {
    multipleChoice(_id: ID!): MultipleChoice!
    multipleChoices: [MultipleChoice!]!
  }

  extend type Mutation {
    createMultipleChoice(question: String!, choices: [String], assignment: Boolean): MultipleChoice!
    #TODO updateMultipleChoice
    #TODO deleteMultipleChoice
  }

  extend type Subscription {
    multipleChoiceCreated: MultipleChoice!
    multipleChoiceUpdated: MultipleChoice!
    multipleChoiceDeleted: MultipleChoice!
  }
`;

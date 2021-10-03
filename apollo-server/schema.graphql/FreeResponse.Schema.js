const { gql } = require("apollo-server-express");

module.exports = gql`
  type FreeResponse implements Question {
    _id: ID!
    question: String!
    answers: [Answer]
  }

  extend type Query {
    freeResponse(_id: ID!): FreeResponse!
    freeResponses: [FreeResponse!]!
  }

  extend type Mutation {
    createFreeResponse(question: String!): FreeResponse!
  }

  extend type Subscription {
    freeResponseCreated: FreeResponse!
    freeResponseUpdated: FreeResponse!
    freeResponseDeleted: FreeResponse!
  }
`;

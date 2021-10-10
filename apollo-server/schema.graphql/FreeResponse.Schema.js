const { gql } = require("apollo-server-express");

module.exports = gql`
  type FreeResponse implements Question & Assignable {
    _id: ID!
    type: String!
    question: String!
    answers: [Answer]
    assignment: Assignment
  }

  extend type Query {
    freeResponse(_id: ID!): FreeResponse!
    freeResponses: [FreeResponse!]!
  }

  extend type Mutation {
    createFreeResponse(question: String!): FreeResponse!
    #TODO updateFreeResponse
    #TODO deleteFreeResponse
  }

  extend type Subscription {
    freeResponseCreated: FreeResponse!
    freeResponseUpdated: FreeResponse!
    freeResponseDeleted: FreeResponse!
  }
`;

const { gql } = require("apollo-server-express");

module.exports = gql`
  type FreeResponse implements Question & Assignable & SharedResource {
    _id: ID!
    type: String!
    creator: User!
    name: String!
    auths: [Auth!]!
    parent_resource: ParentResource
    parent_resource_type: String
    assignment: Assignment
    question: String!
    answers: [Answer]
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

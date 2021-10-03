const {
  gql
} = require("apollo-server-express");

export default gql `
  type Answer {
    answer: String
    grade: Float
    question: Question
		question_type: String
  }

  extend type Query {
    answer(_id: ID!): Answer!
    answers: [Answer!]!
  }

  extend type Mutation {
    createAnswer(name: String!, start: Date!, end: Date!, prefix: String, suffix: String, description: String): Course!
  }

  extend type Subscription {
    answerCreated: Answer!
    answerUpdated: Answer!
    answerDeleted: Answer!
  }
`;
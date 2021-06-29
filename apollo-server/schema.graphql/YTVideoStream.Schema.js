const { gql } = require("apollo-server-express");

module.exports = gql`
  type YTVideoStream implements VideoStream & SharedResource & Assignable {
    _id: ID!
    type: String!
    assignment: Assignment
    parent_resource: ParentResource!
    parent_resource_type: String!
    creator: User!
    auths: [Auth!]!
    name: String!
    url: String!
    duration: Int!
    checkins: [Checkin!]
  }

  extend type Query {
    YTVideoStream(_id: ID!): YTVideoStream!
    YTVideoStreams: [YTVideoStream!]!
  }

  extend type Mutation {
    createYTVideoStream(
      url: String!
      name: String!
      parent_resource: ID!
      parent_resource_type: String!
      assignment: Boolean
      hidden_until: Date
      due: Date
      points: Float
      duration: Int!
      checkins: [ID!]
    ): YTVideoStream!
    deleteYTVideoStream(_id: ID!): YTVideoStream!
  }

  extend type Subscription {
    YTVideoStreamCreated: YTVideoStream!
    YTVideoStreamUpdated: YTVideoStream!
    YTVideoStreamDeleted: YTVideoStream!
  }
`;

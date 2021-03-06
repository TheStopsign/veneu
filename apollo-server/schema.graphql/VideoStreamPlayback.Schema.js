const { gql } = require("apollo-server-express");

module.exports = gql`
  type VideoStreamPlayback implements Submittable {
    _id: ID!
    type: String!
    submission: Submission
    created_at: Date!
    updated_at: Date!
  }

  extend type VideoStreamPlayback {
    creator: User!
    video_stream: VideoStream!
    video_stream_type: String!
    seconds_watched: Int!
  }

  extend type Query {
    videoStreamPlayback(video_stream: ID!): VideoStreamPlayback
  }

  extend type Mutation {
    createVideoStreamPlayback(video_stream: ID!, video_stream_type: String!): VideoStreamPlayback!
    deleteVideoStreamPlayback(_id: ID!): VideoStreamPlayback!
    watchVideoStreamPlayback(_id: ID!, seconds_watched: Int!): VideoStreamPlayback!
      @rateLimit(window: "10s", max: 11, message: "Rate Limit Reached")
  }

  extend type Subscription {
    VideoStreamPlaybackCreated: VideoStreamPlayback!
    VideoStreamPlaybackUpdated: VideoStreamPlayback!
    VideoStreamPlaybackDeleted: VideoStreamPlayback!
  }
`;

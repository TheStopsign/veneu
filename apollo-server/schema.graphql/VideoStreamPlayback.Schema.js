const { gql } = require("apollo-server-express");

module.exports = gql`
  type VideoStreamPlayback implements Submittable {
    _id: ID!
    type: String!
    submission: Submission
    video_stream: VideoStream!
    seconds_in: Int!
    created_at: Date!
    updated_at: Date!
  }

  extend type Query {
    videoStreamPlayback(_id: ID!): VideoStreamPlayback!
    videoStreamPlaybacks: [VideoStreamPlayback!]!
  }

  extend type Mutation {
    createVideoStreamPlayback(video_stream: ID!): VideoStreamPlayback!
    deleteVideoStreamPlayback(_id: ID!): VideoStreamPlayback!
    watchVideoStreamPlayback(_id: ID!, seconds_in: Int!): VideoStreamPlayback!
      @rateLimit(window: "10s", max: 10, message: "It's not a race") # Allow playback speed of ~2x
  }

  extend type Subscription {
    VideoStreamPlaybackCreated: VideoStreamPlayback!
    VideoStreamPlaybackUpdated: VideoStreamPlayback!
    VideoStreamPlaybackDeleted: VideoStreamPlayback!
  }
`;

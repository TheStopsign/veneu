const { AuthenticationError, ForbiddenError } = require("apollo-server-express");

const eventName = {
  VIDEOSTREAMPLAYBACK_CREATED: "VIDEOSTREAMPLAYBACK_CREATED",
  VIDEOSTREAMPLAYBACK_UPDATED: "VIDEOSTREAMPLAYBACK_UPDATED",
  VIDEOSTREAMPLAYBACK_DELETED: "VIDEOSTREAMPLAYBACK_DELETED"
};

module.exports = {
  Query: {
    videoStreamPlayback: (parent, { _id }, { requester, models: { VideoStreamPlayback } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return VideoStreamPlayback.findById({ _id: _id });
    },
    videoStreamPlaybacks: (parent, args, { requester, models: { VideoStreamPlayback } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return VideoStreamPlayback.find();
    }
  },
  Mutation: {
    createVideoStreamPlayback: (
      parent,
      { video_stream },
      { requester, models: { VideoStreamPlayback, Submission } },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return VideoStreamPlayback.create({
        video_stream,
        creator: requester._id
      }).then(videoStreamPlayback => {
        return Submission.create({
          submittable: videoStreamPlayback._id,
          submittable_type: "VideoStreamPlayback"
        }).then(submission => {
          return videoStreamPlayback;
        });
      });
    },
    deleteVideoStreamPlayback: (parent, { _id }, { requester, models: { VideoStreamPlayback } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return;
    }
  },
  Subscription: {
    VideoStreamPlaybackCreated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.VIDEOSTREAMPLAYBACK_CREATED])
    },
    VideoStreamPlaybackUpdated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.VIDEOSTREAMPLAYBACK_UPDATED])
    },
    VideoStreamPlaybackDeleted: {
      subscribe: () => global.pubsub.asyncIterator([eventName.VIDEOSTREAMPLAYBACK_DELETED])
    }
  },
  VideoStreamPlayback: {}
};

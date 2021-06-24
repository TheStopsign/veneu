const { AuthenticationError, ForbiddenError, UserInputError } = require("apollo-server-express");

const eventName = {
  VIDEOSTREAMPLAYBACK_CREATED: "VIDEOSTREAMPLAYBACK_CREATED",
  VIDEOSTREAMPLAYBACK_UPDATED: "VIDEOSTREAMPLAYBACK_UPDATED",
  VIDEOSTREAMPLAYBACK_DELETED: "VIDEOSTREAMPLAYBACK_DELETED",
};

module.exports = {
  Query: {
    videoStreamPlayback: (parent, { video_stream }, { requester, models: { VideoStreamPlayback } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return VideoStreamPlayback.findOne({ video_stream, creator: requester._id });
    },
    videoStreamPlaybacks: (parent, args, { requester, models: { VideoStreamPlayback } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return VideoStreamPlayback.find();
    },
  },
  Mutation: {
    createVideoStreamPlayback: (
      parent,
      { video_stream, video_stream_type },
      { requester, models: { VideoStreamPlayback, Submission } },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return VideoStreamPlayback.create({
        video_stream,
        video_stream_type,
        creator: requester._id,
      }).then((videoPlayback) => {
        return Submission.create({
          submittable: videoPlayback._id,
          submittable_type: "VideoStreamPlayback",
        }).then((submission) => {
          return videoPlayback;
        });
      });
    },
    deleteVideoStreamPlayback: (parent, { _id }, { requester, models: { VideoStreamPlayback } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return;
    },
    watchVideoStreamPlayback: (
      parent,
      { _id, seconds_watched },
      { requester, models: { VideoStreamPlayback } },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return VideoStreamPlayback.findOne({ _id }).then((videoStreamPlayback) => {
        let dPlayTime = seconds_watched - videoStreamPlayback.seconds_watched,
          dRealTime = (Date.now() - new Date(videoStreamPlayback.updated_at).getTime()) / 1000;
        const MOE = 2.25;
        if (seconds_watched > videoStreamPlayback.seconds_watched) {
          console.log(dPlayTime / dRealTime);
          if (dPlayTime / dRealTime > MOE) {
            throw new Error("Too fast");
          } else {
            return VideoStreamPlayback.findOneAndUpdate(
              { _id: videoStreamPlayback._id },
              { seconds_watched },
              { new: true }
            ).then((updated) => {
              return updated;
            });
          }
        } else {
          throw new UserInputError("Must have watched more seconds than previously watched");
        }
      });
    },
  },
  Subscription: {
    VideoStreamPlaybackCreated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.VIDEOSTREAMPLAYBACK_CREATED]),
    },
    VideoStreamPlaybackUpdated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.VIDEOSTREAMPLAYBACK_UPDATED]),
    },
    VideoStreamPlaybackDeleted: {
      subscribe: () => global.pubsub.asyncIterator([eventName.VIDEOSTREAMPLAYBACK_DELETED]),
    },
  },
  VideoStreamPlayback: {
    submission: (parent, args, { models: { Submission } }, info) => {
      return Submission.findOne({ submittable: parent._id });
    },
    video_stream: (parent, args, { models }, info) => {
      return models[parent.video_stream_type].findOne({ _id: parent.video_stream });
    },
  },
};

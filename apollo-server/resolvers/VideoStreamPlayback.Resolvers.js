const { AuthenticationError, ForbiddenError, UserInputError } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");

const eventName = {
  VIDEOSTREAMPLAYBACK_CREATED: "VIDEOSTREAMPLAYBACK_CREATED",
  VIDEOSTREAMPLAYBACK_UPDATED: "VIDEOSTREAMPLAYBACK_UPDATED",
  VIDEOSTREAMPLAYBACK_DELETED: "VIDEOSTREAMPLAYBACK_DELETED",
};

module.exports = (pubsub) => ({
  Query: {
    videoStreamPlayback: (parent, { video_stream }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne(
        { video_stream, creator: requester._id, type: "VideoStreamPlayback" },
        { requester, models, loaders, pubsub }
      );
    },
    videoStreamPlaybacks: (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readMany({ type: "VideoStreamPlayback" }, { requester, models, loaders, pubsub });
    },
  },
  Mutation: {
    createVideoStreamPlayback: (
      parent,
      { video_stream, video_stream_type },
      { requester, models, loaders, pubsub },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return createOne(
        {
          video_stream,
          video_stream_type,
          creator: requester._id,
          type: "VideoStreamPlayback",
        },
        { requester, models, loaders, pubsub }
      ).then((videoPlayback) =>
        createOne(
          {
            submittable: videoPlayback._id,
            submittable_type: "VideoStreamPlayback",
            type: "Submission",
          },
          { requester, models, loaders, pubsub }
        ).then((submission) => videoPlayback)
      );
    },
    deleteVideoStreamPlayback: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return deleteOne({ _id, type: "VideoStreamPlayback" }, { requester, models, loaders, pubsub });
    },
    watchVideoStreamPlayback: (parent, { _id, seconds_watched }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne({ _id, type: "VideoStreamPlayback" }, { requester, models, loaders, pubsub }).then(
        (videoStreamPlayback) => {
          let dPlayTime = seconds_watched - videoStreamPlayback.seconds_watched,
            dRealTime = (Date.now() - new Date(videoStreamPlayback.updated_at).getTime()) / 1000;
          const MOE = 2.25;
          if (seconds_watched > videoStreamPlayback.seconds_watched) {
            if (dPlayTime / dRealTime > MOE) {
              throw new Error("Too fast");
            } else {
              return updateOne(
                { _id: videoStreamPlayback._id, type: "VideoStreamPlayback" },
                { seconds_watched },
                { requester, models, loaders, pubsub }
              );
            }
          } else {
            throw new UserInputError("Must have watched more seconds than previously watched");
          }
        }
      );
    },
  },
  Subscription: {
    VideoStreamPlaybackCreated: {
      subscribe: () => pubsub.asyncIterator([eventName.VIDEOSTREAMPLAYBACK_CREATED]),
    },
    VideoStreamPlaybackUpdated: {
      subscribe: () => pubsub.asyncIterator([eventName.VIDEOSTREAMPLAYBACK_UPDATED]),
    },
    VideoStreamPlaybackDeleted: {
      subscribe: () => pubsub.asyncIterator([eventName.VIDEOSTREAMPLAYBACK_DELETED]),
    },
  },
  VideoStreamPlayback: {
    submission: (parent, args, { loaders: { Submission } }, info) =>
      parent.submission ? Submission.load(parent.submission) : null,
    video_stream: (parent, args, { loaders }, info) => loaders[parent.video_stream_type].load(parent.video_stream),
  },
});

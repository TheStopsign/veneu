const { ForbiddenError, UserInputError } = require("apollo-server-express");
const { readOne, crudFunnel } = require("../crudHandlers");

const eventName = {
  VIDEOSTREAMPLAYBACK_CREATED: "VIDEOSTREAMPLAYBACK_CREATED",
  VIDEOSTREAMPLAYBACK_UPDATED: "VIDEOSTREAMPLAYBACK_UPDATED",
  VIDEOSTREAMPLAYBACK_DELETED: "VIDEOSTREAMPLAYBACK_DELETED",
};

module.exports = (pubsub, caches) => ({
  Query: {
    videoStreamPlayback: (parent, { video_stream }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne(
        { video_stream, creator: requester._id, type: "VideoStreamPlayback" },
        { requester, models, loaders, pubsub, caches }
      );
    },
  },
  Mutation: {
    createVideoStreamPlayback: async (
      parent,
      { video_stream, video_stream_type },
      { requester, models, loaders, pubsub, caches },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel(
        "VideoStreamPlayback",
        "create",
        {
          video_stream,
          video_stream_type,
          creator: requester._id,
        },
        null,
        { models, loaders, pubsub, caches }
      ).then((videoPlayback) =>
        crudFunnel(
          "Submission",
          "create",
          {
            submittable: videoPlayback._id,
            submittable_type: "VideoStreamPlayback",
          },
          null,
          { models, loaders, pubsub, caches }
        ).then((submission) => videoPlayback)
      );
    },
    deleteVideoStreamPlayback: async (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("VideoStreamPlayback", "deleteOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
    watchVideoStreamPlayback: async (
      parent,
      { _id, seconds_watched },
      { requester, models, loaders, pubsub, caches },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("VideoStreamPlayback", "findOne", { _id }, _id, {
        models,
        loaders,
        pubsub,
        caches,
      }).then((videoStreamPlayback) => {
        let dPlayTime = seconds_watched - videoStreamPlayback.seconds_watched,
          dRealTime = (Date.now() - new Date(videoStreamPlayback.updated_at).getTime()) / 1000;
        const MOE = 2.25;
        if (seconds_watched > videoStreamPlayback.seconds_watched) {
          if (dPlayTime / dRealTime > MOE) {
            throw new Error("Too fast");
          } else {
            return crudFunnel(
              "VideoStreamPlayback",
              "updateOne",
              [{ _id: videoStreamPlayback._id }, { seconds_watched }],
              videoStreamPlayback._id,
              { models, loaders, pubsub, caches }
            );
          }
        } else {
          throw new UserInputError("Must have watched more seconds than previously watched");
        }
      });
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
    submission: (parent, args, { models, loaders, pubsub, caches }, info) =>
      parent.submission
        ? crudFunnel("Submission", "findOne", { _id: parent.submission }, parent.submission, {
            models,
            loaders,
            pubsub,
            caches,
          })
        : null,
    video_stream: (parent, args, { models, loaders, pubsub, caches }, info) =>
      crudFunnel(parent.video_stream_type, "findOne", { _id: parent.video_stream }, parent.video_stream, {
        models,
        loaders,
        pubsub,
        caches,
      }),
  },
});

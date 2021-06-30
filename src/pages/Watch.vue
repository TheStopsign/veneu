<template>
  <q-page id="watch" class="items-center q-pa-md">
    <div v-if="error">Error... {{ error }}</div>
    <div style="max-width: 100%" v-else-if="loading">
      <q-skeleton height="75vh" square />
    </div>
    <div v-if="YTVideoStream" id="videostreamloaded">
      <div class="q-pa-xs neu-convex">
        <q-responsive :ratio="16 / 9">
          <video id="video_player" class="video-js vjs-big-play-centered" playsinline></video>
        </q-responsive>
      </div>
    </div>
  </q-page>
</template>

<script>
import "videojs-youtube/dist/Youtube.min.js";
import videojs from "video.js";
import vjsConstantTime from "videojs-constant-timeupdate";
import gql from "graphql-tag";
export default {
  name: "Watch",
  props: {
    me: Object,
  },
  data() {
    return {
      lecture: {
        video_ref: null,
      },
      vjs: null,
      loading: true,
      error: null,
      YTVideoStream: null,
      videoPlayback: {
        seconds_watched: 0,
        prevTime: 0,
        updated_at: Date.now(),
      },
      bigbrotherinstance: null,
      seconds_watched: 0,
      relevantTickets: [],
    };
  },
  beforeDestroy() {
    if (this.vjs) {
      this.vjs.dispose();
    }
    if (this.bigbrotherinstance) {
      clearInterval(this.bigbrotherinstance);
    }
  },
  created() {
    this.$apollo
      .query({
        query: gql`
          query YTVideoStream($_id: ID!) {
            YTVideoStream(_id: $_id) {
              _id
              url
              name
              type
              assignment {
                _id
                due
              }
              duration
              checkins {
                _id
              }
            }
            tickets {
              _id
              code
              checkin {
                _id
                created_at
              }
            }
          }
        `,
        variables: { _id: this.$route.query.v },
      })
      .then((data) => {
        this.YTVideoStream = data.data.YTVideoStream;
        this.relevantTickets = this.findRelevantTickets(data.data.tickets, this.YTVideoStream.checkins);
        if (this.YTVideoStream.assignment || this.relevantTickets.length < this.YTVideoStream.checkins.length) {
          this.$apollo
            .query({
              query: gql`
                query videoStreamPlayback($video_stream: ID!) {
                  videoStreamPlayback(video_stream: $video_stream) {
                    _id
                    type
                    submission {
                      _id
                      type
                    }
                    video_stream {
                      _id
                      type
                    }
                    video_stream_type
                    seconds_watched
                    updated_at
                    created_at
                  }
                }
              `,
              variables: { video_stream: this.$route.query.v },
            })
            .then((data2) => {
              if (data2.data.videoStreamPlayback) {
                this.videoPlayback = { ...this.videoPlayback, ...data2.data.videoStreamPlayback };
                this.loading = false;
                this.setupVjs();
              } else {
                this.$apollo
                  .mutate({
                    mutation: gql`
                      mutation createVideoStreamPlayback($video_stream: ID!, $video_stream_type: String!) {
                        createVideoStreamPlayback(video_stream: $video_stream, video_stream_type: $video_stream_type) {
                          _id
                          type
                          video_stream {
                            _id
                            type
                          }
                          video_stream_type
                          seconds_watched
                          updated_at
                          created_at
                        }
                      }
                    `,
                    variables: { video_stream: this.YTVideoStream._id, video_stream_type: "YTVideoStream" },
                  })
                  .then((data3) => {
                    this.videoPlayback = { ...this.videoPlayback, ...data3.data.createVideoStreamPlayback };
                    this.loading = false;
                    this.setupVjs();
                  });
              }
            });
        } else {
          this.loading = false;
          this.setupVjs();
        }
      })
      .catch((e) => {
        this.error = e;
      });
  },
  mounted() {},
  methods: {
    findRelevantTickets(tickets, checkins) {
      return checkins
        ? tickets.filter((ticket) => checkins.map((checkin) => checkin._id).includes(ticket.checkin._id))
        : [];
    },
    setupVjs() {
      let self = this;
      self.lecture.video_type = "video/youtube";
      self.lecture.video_ref = self.YTVideoStream.url;
      self.$nextTick(function () {
        videojs(
          "video_player",
          {
            techOrder: ["youtube"],
            sources: [{ src: self.lecture.video_ref, type: self.lecture.video_type }],
            controls: true,
            autoplay: false,
            controlBar: {
              fullscreenToggle: false,
            },
            forceSSL: true,
          },
          function () {
            self.vjs = this;

            const constantTimePlugin = new vjsConstantTime(self.vjs, { interval: 1000, roundFn: Math.round });
            const bigbrother = function () {
              let currTime = self.vjs.currentTime(),
                dPlayTime = currTime - self.videoPlayback.prevTime,
                dRealTime = (Date.now() - self.videoPlayback.updated_at) / 1000;
              const MOE = 2.25;
              if (currTime > self.videoPlayback.seconds_watched) {
                if (dPlayTime / dRealTime > MOE) {
                  self.vjs.currentTime(Math.max(self.videoPlayback.prevTime - 1, 0));
                  self.videoPlayback.updated_at = Date.now();
                } else {
                  //WATCH MUTATION
                  self.videoPlayback.prevTime = currTime;
                  self.videoPlayback.updated_at = Date.now();
                  self.videoPlayback.seconds_watched = currTime;
                  self.$apollo
                    .mutate({
                      mutation: gql`
                        mutation watchVideoStreamPlayback($_id: ID!, $seconds_watched: Int!) {
                          watchVideoStreamPlayback(_id: $_id, seconds_watched: $seconds_watched) {
                            _id
                            type
                            video_stream {
                              _id
                              type
                            }
                            video_stream_type
                            seconds_watched
                            updated_at
                            created_at
                          }
                        }
                      `,
                      variables: {
                        _id: self.videoPlayback._id,
                        seconds_watched: parseInt(self.videoPlayback.seconds_watched),
                      },
                    })
                    .catch((e) => {
                      self.vjs.currentTime(Math.max(self.videoPlayback.prevTime - 1, 0));
                      self.videoPlayback.updated_at = Date.now();
                    });
                }
              } else {
                self.videoPlayback.prevTime = currTime;
                self.videoPlayback.updated_at = Date.now();
              }
            };
            if (
              self.YTVideoStream.assignment &&
              self.YTVideoStream.duration - self.videoPlayback.seconds_watched > 5 &&
              self.relevantTickets.length < self.YTVideoStream.checkins.length
            ) {
              self.vjs.on("play", function () {
                self.videoPlayback.updated_at = Date.now();
              });
              self.vjs.on("seeked", bigbrother);
              self.vjs.on("constant-timeupdate", bigbrother);
              self.vjs.on("fullscreenchange", function () {
                if (self.vjs.isFullscreen()) {
                  self.vjs.exitFullscreen();
                }
              });
              self.vjs.on("ended", function () {
                // self.submission.video_progress = self.lecture.video_length;
                // self.submission.video_percent = 1;
                // self.submission.playback_submission_time = new Date();
              });
            }
          }
        );
      });
    },
    getBaseUrl() {
      var getUrl = window.location;
      return getUrl.protocol + "//" + getUrl.host;
    },
  },
};
</script>

<style scoped>
.q-skeleton {
  border-radius: 1rem;
}
.q-responsive {
  max-height: 75vh;
}
video {
  width: 100%;
}
.vjs-tech {
  position: unset;
}
</style>

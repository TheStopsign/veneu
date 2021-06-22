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
import gql from "graphql-tag";
export default {
  name: "Watch",
  props: {
    me: Object
  },
  data() {
    return {
      lecture: {
        video_ref: null
      },
      vjs: null,
      loading: true,
      error: null,
      YTVideoStream: null,
      submission: {},
      prevTime: 0,
      bigbrotherinstance: null
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
    if (!this.submission.video_progress) {
      this.submission.video_progress = 0;
    }
    if (!this.submission.video_percent) {
      this.submission.video_percent = 0;
    }
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
            }
          }
        `,
        variables: { _id: this.$route.query.v }
      })
      .then(data => {
        this.loading = false;
        this.YTVideoStream = data.data.YTVideoStream;
        let self = this;
        self.lecture.video_type = "video/youtube";
        self.lecture.video_ref = self.YTVideoStream.url;
        self.$nextTick(function() {
          videojs(
            "video_player",
            {
              techOrder: ["youtube"],
              sources: [{ src: self.lecture.video_ref, type: self.lecture.video_type }],
              controls: true,
              autoplay: false,
              controlBar: {
                fullscreenToggle: false
              },
              forceSSL: true
            },
            function() {
              self.vjs = this;
              self.vjs.on("fullscreenchange", function() {
                if (self.vjs.isFullscreen()) {
                  self.vjs.exitFullscreen();
                }
              });

              var bigbrother = () => {
                let currTime = self.vjs.currentTime();
                let committed = false;
                if (currTime - self.prevTime < 1.5 && currTime >= self.prevTime) {
                  //Considered NOT a 'seek', video is playing normally
                  if (self.submission.video_progress < Math.floor(currTime)) {
                    self.submission.video_progress = Math.floor(currTime);
                    self.submission.video_percent = Math.floor(currTime) / self.lecture.video_length;
                    if (self.submission.video_progress % 5 == 0) {
                      self.submission.playback_submission_time = new Date();
                    }
                  }
                  // for (let i = 0; i < self.polls.length; i++) {
                  //   if (currTime > self.polls[i].timestamp) {
                  //     //if there is not an answer for the code, and there is not an answer for the timestamp, show the poll
                  //     if (
                  //       !(
                  //         (self.polls[i].code && self.submission.student_poll_answers[self.polls[i].code]) ||
                  //         (self.polls[i].timestamp && self.submission.student_poll_answers[self.polls[i].timestamp])
                  //       )
                  //     ) {
                  //       self.vjs.currentTime(self.polls[i].timestamp);
                  //       self.vjs.pause();
                  //       // self.startPoll(i);
                  //       committed = true;
                  //     }
                  //   }
                  // }
                } else {
                  //Considered a 'seek'
                  if (currTime > self.submission.video_progress) {
                    self.vjs.currentTime(self.prevTime);
                    committed = true;
                  } else if (currTime < self.prevTime) {
                    for (let i = 0; i < self.polls.length; i++) {
                      self.hidePoll(i);
                    }
                  }
                }
                if (!committed) {
                  self.prevTime = self.vjs.currentTime();
                }
              };
              self.bigbrotherinstance = setInterval(bigbrother, 1000);
              self.vjs.on("ended", function() {
                self.submission.video_progress = self.lecture.video_length;
                self.submission.video_percent = 1;
                self.submission.playback_submission_time = new Date();
              });
            }
          );
        });
      })
      .catch(e => {
        this.error = e;
      });
  },
  mounted() {},
  methods: {
    getBaseUrl() {
      var getUrl = window.location;
      return getUrl.protocol + "//" + getUrl.host;
    }
  }
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

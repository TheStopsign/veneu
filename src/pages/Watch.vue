<template>
  <q-page id="watch" class="items-center q-pa-md">
    <div v-if="error">Error... {{ error }}</div>
    <div style="max-width: 100%" v-else-if="loading">
      <q-skeleton height="75vh" square />
    </div>
    <div v-if="YTVideoStream" id="videostreamloaded">
      <div class="q-pa-sm neu-convex">
        <q-responsive :ratio="16 / 9">
          <video id="video_player" class="video-js vjs-big-play-centered" controls playsinline>
            <source
              v-bind:src="
                lecture.video_ref +
                  (lecture.video_type == 'video/youtube' ? '?showinfo=0&enablejsapi=1&origin=' + getBaseUrl() : '')
              "
              :type="lecture.video_type"
            />
          </video>
        </q-responsive>
      </div>
    </div>
  </q-page>
</template>

<script>
import videojs from "video.js";
import gql from "graphql-tag";
require("videojs-youtube");
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
      YTVideoStream: null
    };
  },
  beforeDestroy() {
    if (this.vjs) {
      this.vjs.dispose();
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
        self.lecture.video_ref = this.YTVideoStream.url;
        self.$nextTick(function() {
          videojs("video_player", {}, function() {
            self.vjs = this;
          });
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

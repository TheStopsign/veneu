<template>
  <q-page id="watch" class="items-center q-pa-md">
    <div class="q-pa-sm neu-convex">
      <div style="max-width: 100%" v-if="!lecture.video_ref || 0">
        <q-skeleton height="75vh" square />
      </div>
      <q-responsive :ratio="16 / 9" v-else>
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
  </q-page>
</template>

<script>
import videojs from "video.js";
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
      vjs: null
    };
  },
  beforeDestroy() {
    if (this.vjs) {
      this.vjs.dispose();
    }
  },
  created() {},
  mounted() {
    let self = this;
    self.lecture.video_type = "video/youtube";
    self.lecture.video_ref = "https://www.youtube.com/watch?v=7h1kDYFMCVA";
    self.$nextTick(function() {
      videojs("video_player", {}, function() {
        self.vjs = this;
      });
    });
  },
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

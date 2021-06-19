<template>
  <q-page id="create-course" class="q-pa-md">
    <ApolloMutation
      :mutation="require('../graphql/CreateYTVideoStream.gql')"
      :variables="{ url, name, parent_resource, parent_resource_type }"
      class="form q-pb-md"
      @done="handleCreateVideo"
    >
      <template slot-scope="{ mutate }">
        <q-form @submit.prevent="mutate()" class="q-gutter-md q-ma-md q-py-md q-pt-lg neu-convex">
          <div>
            <i><h1>Create a New Video</h1></i>
          </div>
          <ResourceSelector
            :me="me"
            label="For Lecture..."
            :selected="parent_resource"
            :selectable="me.auths.filter(a => a.shared_resource_type === 'Lecture').map(a => a._id)"
            @change="handleChangeLecture"
            class="q-mt-md"
          />
          <q-input
            standout="bg-primary text-white q-ma-none"
            color="primary"
            class="text-primary q-mt-none"
            v-model="name"
            label="Video Name"
            placeholder="e.g. Syllabus Day Recording"
          />
          <q-input
            standout="bg-primary text-white q-ma-none"
            color="primary"
            class="text-primary q-mt-md"
            v-model="url"
            label="YT Link"
            placeholder="e.g. https://www.youtube.com/watch?v=tz56ac6BaJQ"
            @change="handleYTUrlChange()"
          />
          <div class="q-pa-sm neu-convex" v-if="yt_valid">
            <q-responsive :ratio="16 / 9">
              <video id="video_player" class="video-js vjs-big-play-centered" controls playsinline autoplay>
                <source :src="url" type="video/youtube" />
              </video>
            </q-responsive>
          </div>

          <div class="q-ma-md q-px-md row full-width">
            <q-toggle
              v-model="is_assignment"
              checked-icon="check"
              color="green"
              unchecked-icon="clear"
              label="Assignment"
              size="xl"
            />
          </div>

          <q-bar class="q-pa-none q-gutter-x-md">
            <q-btn label="Back" class="q-ml-sm" @click="handleBack" />
            <q-btn type="submit" color="primary" label="Continue" class="q-ml-sm full-width" :disabled="!formValid()" />
          </q-bar>
        </q-form>
      </template>
    </ApolloMutation>
  </q-page>
</template>

<script>
import ResourceSelector from "../components/ResourceSelector";
import videojs from "video.js";
require("videojs-youtube");
export default {
  name: "CreateRegistrationSection",
  props: {
    me: Object
  },
  components: {
    ResourceSelector
  },
  data() {
    return {
      name: "",
      url: "",
      parent_resource: this.$route.query.from ? this.$route.query.from : null,
      parent_resource_type: "Lecture",
      yt_valid: false,
      vjs: null,
      duration: -1,
      is_assignment: false
    };
  },
  beforeDestroy() {
    this.tryDisposeVjs();
  },
  methods: {
    handleYTUrlChange() {
      let self = this;
      if (self.vjs) {
        document.getElementsByClassName("video-js")[0].remove();
        self.vjs.dispose();
        self.vjs = null;
        self.duration = -1;
        self.yt_valid = false;
      }
      self.$nextTick(() => {
        if (/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/gm.test(self.url)) {
          self.yt_valid = true;
          self.$nextTick(() => {
            if (self.vjs) {
              self.vjs.src({
                type: "video/youtube",
                src: self.url
              });
              self.vjs.pause();
              self.duration = self.vjs.duration();
              console.log(self.duration);
            } else {
              videojs("video_player", {}, function() {
                self.vjs = this;
                self.vjs.pause();
                self.vjs.one("loadedmetadata", function() {
                  self.duration = self.vjs.duration();
                  console.log(self.duration);
                });
              });
            }
          });
        } else {
          self.yt_valid = false;
        }
      });
    },
    tryDisposeVjs() {
      if (this.vjs) {
        this.vjs.dispose();
        this.vjs = null;
      }
      this.yt_valid = false;
    },
    handleBack() {
      this.$router.go(-1);
    },
    formValid() {
      if (!this.parent_resource || !this.parent_resource_type) {
        return false;
      }
      if (
        !this.me.auths.find(a => a.shared_resource._id == this.parent_resource && a.shared_resource_type == "Lecture")
      ) {
        return false;
      }
      if (!this.name.length) {
        return false;
      }
      if (!this.url.length) {
        return false;
      }
      if (this.duration < 0) {
        return false;
      }
      return true;
    },
    toTitleCase(str) {
      return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    },
    handleCreateVideo() {
      this.name = "";
      this.url = "";
      this.$router.push({ name: "Dashboard" });
    },
    handleChangeLecture(parent_resource) {
      this.parent_resource = parent_resource;
    }
  }
};
</script>

<style scoped></style>

<template>
  <q-page id="create-course">
    <q-form @submit.prevent="handleCreateVideo">
      <div class="q-gutter-md q-ma-md q-pt-lg q-pb-xl q-px-md neu-convex">
        <div>
          <i><h1>Create a New Video</h1></i>
        </div>
        <q-input
          standout="bg-primary text-white q-ma-none"
          color="primary"
          class="text-primary q-mt-md"
          v-model="name"
          label="Video Name"
          placeholder="e.g. Syllabus Day Recording"
        />
        <ResourceSelector
          :me="me"
          label="For Lecture..."
          :selected="parent_resource"
          :selectable="me.auths.filter((a) => a.shared_resource_type === 'Lecture').map((a) => a._id)"
          @change="handleChangeLecture"
          class="q-mt-lg q-mb-lg"
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
        <div class="q-pa-xs neu-convex" v-if="yt_valid">
          <q-responsive :ratio="16 / 9">
            <video id="video_player" class="video-js vjs-big-play-centered" playsinline></video>
          </q-responsive>
        </div>

        <div class="q-ma-md q-px-md row full-width justify-center">
          <q-toggle
            v-model="is_assignment"
            checked-icon="check"
            color="primary"
            unchecked-icon="clear"
            label="Is this an assignment?"
            size="xl"
          />
        </div>

        <div class="q-mb-md q-px-md full-width" v-if="is_assignment">
          <div class="row full-width justify-center q-mt-md">Watch by...</div>
          <div class="row full-width q-mb-lg">
            <q-date
              v-model="assignment.due"
              mask="YYYY-MM-DD HH:mm"
              color="primary"
              class="col-12 col-sm q-mr-md q-mt-md"
            />
            <q-time
              v-model="assignment.due"
              mask="YYYY-MM-DD HH:mm"
              color="primary"
              class="col-12 col-sm q-mt-md neu-convex"
            />
          </div>
          <div class="row full-width justify-center q-mt-xl"><h3>Optional</h3></div>
          <CheckinSelector :me="me" label="Associated checkins" @change="handleChangeCheckin" />
          <q-input
            type="number"
            standout="bg-primary text-white q-ma-none"
            color="primary"
            class="text-primary q-mt-md"
            v-model="points"
            label="Points"
            placeholder="e.g. 20"
          />
          <div class="row full-width justify-center q-mt-md">Hidden until...</div>
          <div class="row full-width">
            <q-date
              v-model="assignment.hidden_until"
              mask="YYYY-MM-DD HH:mm"
              color="primary"
              class="col-12 col-sm q-mr-md q-mt-md"
            />
            <q-time
              v-model="assignment.hidden_until"
              mask="YYYY-MM-DD HH:mm"
              color="primary"
              class="col-12 col-sm q-mt-md neu-convex"
            />
          </div>
        </div>

        <q-bar class="q-pa-none q-gutter-x-md q-mt-md">
          <q-btn label="Back" class="q-ml-sm" @click="handleBack" />
          <q-btn type="submit" color="primary" label="Continue" class="q-ml-sm full-width" :disabled="!formValid()" />
        </q-bar>
      </div>
    </q-form>
  </q-page>
</template>

<script>
import videojs from "video.js";
require("videojs-youtube");
import gql from "graphql-tag";
import ResourceSelector from "../components/ResourceSelector";
import CheckinSelector from "../components/CheckinSelector";
export default {
  name: "CreateVideo",
  props: {
    me: Object,
  },
  components: {
    ResourceSelector,
    CheckinSelector,
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
      is_assignment: false,
      assignment: {
        hidden_until: null,
        due: null,
      },
      points: null,
      checkins: [],
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
                src: self.url,
              });
              self.vjs.pause();
              self.duration = self.vjs.duration();
              console.log("CHANGE - " + self.duration);
            } else {
              videojs(
                "video_player",
                {
                  techOrder: ["youtube"],
                  sources: [{ src: self.url, type: "video/youtube" }],
                  autoplay: true,
                  controls: true,
                  forceSSL: true,
                },
                function () {
                  self.vjs = this;
                  self.vjs.one("loadedmetadata", function () {
                    self.vjs.pause();
                    self.duration = self.vjs.duration();
                    console.log("START - " + self.duration);
                  });
                }
              );
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
        !this.me.auths.find((a) => a.shared_resource._id == this.parent_resource && a.shared_resource_type == "Lecture")
      ) {
        return false;
      }
      if (!this.name.length) {
        return false;
      }
      if (!this.url.length || !this.yt_valid) {
        return false;
      }
      if (this.is_assignment) {
        if (!this.duration > 0) {
          return false;
        }
        if (!this.assignment.due) {
          return false;
        }
      }

      return true;
    },
    toTitleCase(str) {
      return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    },
    handleCreateVideo() {
      if (this.formValid()) {
        this.$apollo
          .mutate({
            mutation: gql`
              mutation createYTVideoStream(
                $url: String!
                $name: String!
                $parent_resource: ID!
                $parent_resource_type: String!
                $assignment: Boolean
                $hidden_until: Date
                $due: Date
                $points: Float
                $duration: Int!
                $checkins: [ID!]
              ) {
                createYTVideoStream(
                  url: $url
                  name: $name
                  parent_resource: $parent_resource
                  parent_resource_type: $parent_resource_type
                  assignment: $assignment
                  hidden_until: $hidden_until
                  due: $due
                  points: $points
                  duration: $duration
                  checkins: $checkins
                ) {
                  _id
                  url
                  name
                  type
                  parent_resource {
                    ... on SharedResource {
                      _id
                      name
                      type
                    }
                  }
                  parent_resource_type
                }
              }
            `,
            variables: {
              url: this.url,
              name: this.name,
              parent_resource: this.parent_resource,
              parent_resource_type: this.parent_resource_type,
              assignment: this.is_assignment,
              hidden_until: this.assignment.hidden_until,
              due: this.assignment.due,
              points: parseFloat(this.points),
              duration: this.duration,
              checkins: this.checkins,
            },
          })
          .then(({ data: { createYTVideoStream } }) => {
            this.$router.push({ name: "Dashboard" });
          })
          .catch((e) => {
            this.$q.notify({
              progress: true,
              message: "Issue creating video, try again " + e,
              icon: "error",
              color: "negative",
            });
          });
      }
    },
    handleChangeLecture(parent_resource) {
      this.parent_resource = parent_resource;
    },
    handleChangeCheckin(val, oldVal) {
      this.checkins = val;
    },
  },
};
</script>

<style scoped></style>

<template>
  <q-page id="create-course">
    <q-form @submit.prevent="handleCreateVideo">
      <div class="q-gutter-y-md q-ma-md q-py-md neu-convex">
        <div>
          <i><h1>Create a New Video</h1></i>
        </div>
        <q-input
          standout="bg-primary text-white q-ma-none"
          color="primary"
          class="text-primary q-mt-md q-mx-md"
          v-model="name"
          label="Video Name"
          placeholder="e.g. Syllabus Day Recording"
        />
        <ResourceSelector
          :me="me"
          label="For Lecture..."
          :selected="parent_resource"
          :selectable="me.auths.filter((a) => a.shared_resource_type === 'Lecture').map((a) => a._id)"
          v-model="selected_auth"
          class="q-px-md"
        />
        <q-input
          standout="bg-primary text-white q-ma-none"
          color="primary"
          class="text-primary q-mx-md q-mt-md"
          v-model="url"
          label="YT Link"
          placeholder="e.g. https://www.youtube.com/watch?v=tz56ac6BaJQ"
          @change="handleYTUrlChange"
        />
        <div class="q-pa-xs q-mx-md neu-convex" v-if="yt_valid">
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
            <q-time v-model="assignment.due" mask="YYYY-MM-DD HH:mm" color="primary" class="col-12 col-sm q-mt-md" />
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
              class="col-12 col-sm q-mt-md"
            />
          </div>
        </div>

        <div
          v-if="errorMessage.length"
          class="q-ma-md q-px-md row full-width justify-center"
          style="color: red !important"
        >
          {{ errorMessage }}
        </div>

        <q-bar class="q-pa-none q-ml-md q-pr-md q-gutter-x-md">
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
  watch: {
    selected_auth: function (val) {
      console.log("c");
      if (!val) {
        this.selected_auth = {
          shared_resource: {
            _id: null,
          },
          shared_resource_type: null,
        };
      }
    },
  },
  data() {
    return {
      name: "",
      url: "",
      parent_resource: this.$route.query.from ?? null,
      parent_resource_type: "Lecture",
      selected_auth: {
        shared_resource: {
          _id: null,
        },
        shared_resource_type: null,
      },
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
      errorMessage: "",
    };
  },
  beforeDestroy() {
    this.tryDisposeVjs();
  },
  methods: {
    matchYoutubeUrl(url) {
      console.log("a");
      const p =
        /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
      if (url.match(p)) {
        return url.match(p)[1];
      }
      return false;
    },
    handleYTUrlChange() {
      console.log("b");
      let self = this;
      if (self.vjs) {
        document.getElementsByClassName("video-js")[0].remove();
        self.vjs.dispose();
        self.vjs = null;
        self.duration = -1;
        self.yt_valid = false;
      }
      self.$nextTick(() => {
        if (self.matchYoutubeUrl(self.url)) {
          self.yt_valid = true;
          self.$nextTick(() => {
            if (self.vjs) {
              self.vjs.src({
                type: "video/youtube",
                src: self.url,
              });
              self.vjs.pause();
              self.duration = self.vjs.duration();
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
      console.log("e");
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
      console.log("d");
      if (!this.name.length) {
        this.errorMessage = "A name is required";
        return false;
      }
      if (!this.selected_auth.shared_resource._id || !this.selected_auth.shared_resource_type) {
        this.errorMessage = "Select a valid resource";
        return false;
      }
      if (!this.url.length) {
        this.errorMessage = "A link is required";
        return false;
      }
      if (!this.yt_valid) {
        this.errorMessage = "The link entered is invalid";
        return false;
      }
      // Required for assignments
      if (this.is_assignment) {
        if (!this.duration > 0) {
          this.errorMessage = "The video must have a duration";
          return false;
        }
        if (!this.assignment.due) {
          this.errorMessage = "A due date is required for assignments";
          return false;
        }
      }

      this.errorMessage = "";

      return true;
    },
    toTitleCase(str) {
      console.log("f");
      return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    },
    handleCreateVideo() {
      console.log("g");
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
              parent_resource: this.selected_auth.shared_resource._id,
              parent_resource_type: this.selected_auth.shared_resource_type,
              assignment: this.is_assignment,
              hidden_until: this.assignment.hidden_until,
              due: this.assignment.due,
              points: parseFloat(this.points),
              duration: this.duration,
              checkins: this.checkins,
            },
          })
          .then(({ data: { createYTVideoStream } }) => {
            this.$router.push({ name: "Calendar" });
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
    handleChangeCheckin(val, oldVal) {
      console.log("h");
      this.checkins = val;
    },
  },
};
</script>

<style scoped></style>

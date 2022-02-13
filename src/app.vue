<template>
  <q-layout id="app" view="lhr lpr lfr" class="text-primary">
    <q-ajax-bar position="top" color="primary" size="0.25rem" />
    <ApolloQuery :query="require('./graphql/Me.gql')">
      <template slot-scope="{ result: { data, error } }">
        <div v-if="error">{{ tryLogout() }}</div>
        <div v-if="data" id="theme" :data-theme="'' + theme">
          <ApolloSubscribeToMore
            v-if="data.me"
            :document="
              (gql) => gql`
                subscription authCreated($user: ID!) {
                  authCreated(user: $user) {
                    _id
                    role
                    shared_resource {
                      _id
                      name
                      type
                      parent_resource {
                        ... on Course {
                          _id
                          name
                          type
                        }
                        ... on UserGroup {
                          _id
                          name
                          type
                        }
                        ... on RegistrationSection {
                          _id
                          name
                          type
                        }
                        ... on Lecture {
                          _id
                          name
                          type
                        }
                      }
                      parent_resource_type
                    }
                    shared_resource_type
                  }
                }
              `
            "
            :variables="{ user: data.me._id }"
            :updateQuery="onAuthAdded"
          />

          <q-header :class="'text-primary ' + ($q.platform.is.mobile ? 'q-mx-sm' : 'q-mx-md')">
            <q-pull-to-refresh @refresh="refresh" color="white" bg-color="primary">
              <q-toolbar
                id="headertoolbar"
                :class="
                  'q-pa-none q-px-xs ' +
                  (data.me ? 'neu-convex ' : '') +
                  ($q.platform.is.mobile ? 'q-mt-sm' : 'q-mt-md')
                "
              >
                <q-btn
                  v-if="data.me"
                  round
                  size="sm"
                  icon="menu"
                  class="q-mx-sm"
                  title="Menu"
                  aria-label="Menu"
                  @click="left = !left"
                />
                <!-- <q-toolbar-title
                  class="q-px-none"
                  v-if="!['Landing', 'Login', 'Signup', 'FirstTimeLogin'].includes($route.name)"
                >
                  
                </q-toolbar-title> -->

                <q-space />

                <div style="overflow-x: auto; height: 40px" class="toolbar-btns">
                  <q-toggle
                    toggle-indeterminate
                    v-model="theme"
                    unchecked-icon="dark_mode"
                    indeterminate-icon="palette"
                    checked-icon="light_mode"
                    color="primary"
                    size="md"
                  />

                  <q-btn size="sm" round icon="qr_code_2" class="q-mx-sm" title="Checkin" aria-label="Checkin">
                    <q-menu :offset="[0, 16]">
                      <div class="q-pa-xs">
                        <q-item clickable class="row full-width items-center q-ma-none" @click="handleScan"
                          ><q-icon color="primary" size="sm" name="qr_code_scanner" class="q-mr-sm" />Attend</q-item
                        >
                        <q-item
                          v-if="data.me"
                          clickable
                          class="row full-width items-center q-ma-none"
                          @click="handleHost"
                          ><q-icon color="primary" size="sm" name="present_to_all" class="q-mr-sm" />Host</q-item
                        >
                      </div>
                    </q-menu>
                  </q-btn>
                  <q-btn
                    v-if="data.me"
                    size="sm"
                    round
                    icon="notifications"
                    class="q-mx-sm"
                    title="Notifications"
                    aria-label="API"
                  >
                    <q-badge rounded color="red" floating label="1+" />
                  </q-btn>
                  <q-btn
                    size="sm"
                    round
                    icon="auto_awesome"
                    class="q-mx-sm"
                    title="Voyager"
                    aria-label="Voyager"
                    @click="handleVoyager()"
                  />
                </div>
              </q-toolbar>
            </q-pull-to-refresh>
          </q-header>

          <q-drawer v-if="data.me" show-if-above v-model="left" side="left">
            <q-scroll-area
              style="position: absolute; height: 100%; width: 100%"
              :thumb-style="{
                right: '-0.5rem',
                borderRadius: '0.25rem',
                backgroundColor: 'var(--veneu-blue)',
                width: '0.25rem',
                opacity: 1,
              }"
            >
              <div class="row full-width">
                <q-avatar @click="$router.push({ name: 'Calendar' })" class="q-mt-md q-ml-md">
                  <VeneuLogo id="nav-logo" />
                </q-avatar>

                <h1 class="q-mt-md q-mx-md">veneu</h1>
              </div>
              <q-item
                clickable
                class="rounded-borders q-my-md q-ml-md neu-convex"
                :class="$q.screen.lt.md ? 'q-mr-md' : 'q-mr-xs'"
                id="me"
                @click="handleMe"
              >
                <q-item-section avatar class="q-my-xs">
                  <q-avatar id="avatar">
                    {{ getAvatar(data.me) }}
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label>{{ data.me.first_name }} {{ data.me.last_name }}</q-item-label>
                  <q-item-label caption>{{ data.me.email }}</q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-btn
                    flat
                    size="sm"
                    round
                    icon="logout"
                    class="text-primary"
                    title="Logout"
                    aria-label="Logout"
                    @click.stop="confirmLogout = true"
                  />
                  <q-dialog v-model="confirmLogout">
                    <q-card class="q-pa-sm">
                      <q-card-section>
                        <span class="text-primary">Are you sure? We'd hate to see you leave...</span>
                      </q-card-section>

                      <q-card-actions>
                        <q-btn label="Cancel" v-close-popup />
                        <q-space />
                        <q-btn
                          label="Logout"
                          color="primary"
                          v-close-popup
                          @click="tryLogout"
                          icon-right="meeting_room"
                        />
                      </q-card-actions>
                    </q-card>
                  </q-dialog>
                </q-item-section>
              </q-item>
              <div class="row full-width q-pl-md q-mt-md" :class="$q.screen.lt.md ? 'q-pr-md' : 'q-pr-xs'">
                <q-btn size="1.35rem" label="New" icon="add" class="full-width">
                  <q-menu anchor="bottom middle" self="top middle" :offset="[0, 8]">
                    <q-list class="q-pa-xs text-primary">
                      <q-item class="items-center" title="Checkin" clickable @click="handleHost">
                        <!-- <q-icon color="primary" size="sm" name="present_to_all" class="q-mr-sm" /> -->
                        Checkin
                      </q-item>
                      <q-item
                        class="items-center"
                        title="Course"
                        :clickable="$route.name != 'CreateCourse'"
                        @click="$router.push({ name: 'CreateCourse' })"
                        >Course</q-item
                      >
                      <q-item
                        class="items-center"
                        title="Registration Section"
                        :clickable="canCreateSections(data.me.auths) && $route.name != 'CreateRegistrationSection'"
                        @click="$router.push({ name: 'CreateRegistrationSection' })"
                        :disabled="!canCreateSections(data.me.auths)"
                        >Registration Section</q-item
                      >
                      <q-item
                        class="items-center"
                        title="User Group"
                        :clickable="canCreateGroups(data.me.auths) && $route.name != 'CreateUserGroup'"
                        @click="$router.push({ name: 'CreateUserGroup' })"
                        :disabled="!canCreateGroups(data.me.auths)"
                        >User Group</q-item
                      >
                      <q-item
                        class="items-center"
                        title="Registration Section"
                        :clickable="canCreateLectures(data.me.auths) && $route.name != 'CreateLecture'"
                        @click="$router.push({ name: 'CreateLecture' })"
                        :disabled="!canCreateLectures(data.me.auths)"
                        >Lecture</q-item
                      >
                      <q-item
                        class="items-center"
                        title="Video"
                        :clickable="canCreateVideos(data.me.auths) && $route.name != 'CreateVideo'"
                        @click="$router.push({ name: 'CreateVideo' })"
                        :disabled="!canCreateVideos(data.me.auths)"
                        >Video</q-item
                      >
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
              <div class="row full-width q-mt-md q-pl-md" :class="$q.screen.lt.md ? 'q-pr-md' : 'q-pr-xs'">
                <div class="col-6 q-pr-sm">
                  <q-btn size="sm" label="Calendar" icon="today" class="full-width" :to="{ name: 'Calendar' }" />
                </div>
                <div class="col-6 q-pl-sm">
                  <q-btn size="sm" label="Timeline" icon="timeline" class="full-width" :to="{ name: 'Timeline' }" />
                </div>
              </div>
              <ResourceSelector
                ref="nav"
                :me="data.me"
                label="Navigation"
                class="q-pl-md"
                :class="$q.screen.lt.md ? 'q-pr-md' : 'q-pr-xs'"
                nav
                :key="$route.name + $route.params._id"
              />
              <!-- <q-list class="text-primary neu-convex q-ma-md q-pa-xs">
              <course-list :me="data.me" />
            </q-list> -->
              <q-list
                class="text-primary neu-convex q-ml-md q-mb-md q-pa-xs"
                :class="$q.screen.lt.md ? 'q-mr-md' : 'q-mr-xs'"
              >
                <q-expansion-item
                  icon="qr_code_scanner"
                  label="Attended"
                  :content-inset-level="0"
                  expand-icon-class="text-primary"
                >
                  <div v-if="$apollo.queries.tickets.loading">Loading...</div>
                  <q-list v-else-if="tickets">
                    <q-item
                      class="row items-center justify-center"
                      v-for="ticket in tickets"
                      :key="ticket._id"
                      :to="{ name: 'CheckinReceipt', params: { _id: ticket.checkin._id } }"
                    >
                      "{{ ticket.checkin.name }}" - {{ getFormattedDate(ticket.created_at) }}
                    </q-item>
                    <q-item v-if="!tickets.length" class="row items-center justify-center"> None </q-item>
                  </q-list>
                </q-expansion-item>
              </q-list>
            </q-scroll-area>
          </q-drawer>

          <q-scroll-area
            style="position: absolute; height: 100%; width: 100%"
            :thumb-style="{
              right: '0.25rem',
              borderRadius: '0.25rem',
              backgroundColor: 'var(--veneu-blue)',
              width: '0.25rem',
              opacity: 1,
            }"
          >
            <q-page-container class="text-primary">
              <router-view :me="data.me" style="overflow: hidden" :key="$route.name + $route.params._id" />
            </q-page-container>
          </q-scroll-area>
        </div>
      </template>
    </ApolloQuery>
  </q-layout>
</template>

<script>
import { setPalette } from "./styles/palette";
import { date } from "quasar";
import gql from "graphql-tag";
import VeneuLogo from "./components/VeneuLogo";
import ResourceSelector from "./components/ResourceSelector";
import { scroll } from "quasar";
const { getScrollTarget, setScrollPosition } = scroll;
import { createAvatar } from "@dicebear/avatars";
import * as botttsStyle from "@dicebear/avatars-bottts-sprites";
import TICKETSQUERY from "./graphql/tickets.gql";
export default {
  name: "app",
  components: {
    VeneuLogo,
    ResourceSelector,
  },
  apollo: {
    tickets: {
      query: TICKETSQUERY,
    },
  },
  watch: {
    theme: function (val, oldVal) {
      setPalette(document.documentElement, String(val));
    },
    $route: function (from, to) {},
  },
  data() {
    return {
      left: false,
      searchString: "",
      confirmLogout: false,
      theme: localStorage.getItem("theme"),
    };
  },
  created() {
    setPalette(document.documentElement, String(this.theme));
    if (this.theme === "true") {
      this.theme = true;
    }
    if (this.theme === "false") {
      this.theme = false;
    }
    if (this.theme === "null") {
      this.theme = null;
    }
  },
  mounted() {
    // this.$refs.scrollContents.$el.parentElement.parentElement.parentElement.style.height =
    //   this.$refs.scrollContents.$el.offsetHeight + "px";
    // this.$refs.scrollContents.$el.parentElement.style.position = "absolute";
    if (this.$q.platform.is.ios) {
      this.setIosKeyboardHandling();
    }
  },
  methods: {
    handleReceipt(_id) {
      console.log(_id);
      this.$router.push({ name: "CheckinReceipt", params: { _id } });
    },
    isOnMePage() {
      this.$route.name == "Me";
    },
    handleMe() {
      if (!this.isOnMePage()) {
        this.$router.push({ name: "Me" });
      }
    },
    getAvatar: (user) => {
      let avatarEl = document.getElementById("avatar");
      if (avatarEl) {
        avatarEl.innerHTML = createAvatar(botttsStyle, {
          seed: user.bottts ? user.bottts : user._id,
        });
      }
    },

    handleVoyager() {
      location.href = this.isProduction() ? "/voyager" : "http://localhost:4000/voyager";
    },
    isProduction: () => process.env.NODE_ENV === "production",
    ensureOffScreenInput() {
      if (!this.$offscreen) {
        this.$offscreen = document.createElement("input");
        this.$offscreen.style.position = "fixed";
        this.$offscreen.style.top = "0px";
        this.$offscreen.style.opacity = "0.1";
        this.$offscreen.style.width = "10px";
        this.$offscreen.style.height = "10px";
        this.$offscreen.style.transform = "translateX(-1000px)";
        this.$offscreen.type = "text";
        this.$offscreen.id = "__fake_input";
        document.body.appendChild(this.$offscreen);
      }
      return this.$offscreen;
    },
    setIosKeyboardHandling() {
      let self = this;
      console.log("window.scrollTo");
      function scrollToElement(el) {
        let target = getScrollTarget(el);
        let offset = el.offsetTop; // do not subtract the el.scrollHeight here
        let duration = 1000;
        setScrollPosition(target, offset, duration);
      }
      function handleFocus(event) {
        window.scrollTo({ top: 0 });
        self.$nextTick(function () {
          let last = event.target.getBoundingClientRect().top;
          setTimeout(() => {
            function detectMovement() {
              const now = event.target.getBoundingClientRect().top;
              const dist = Math.abs(last - now);

              // Once any animations have stabilized, do your thing
              if (dist > 0.01) {
                requestAnimationFrame(detectMovement);
                last = now;
              } else {
                scrollToElement(event.target);
                event.target.addEventListener("focus", handleFocus, { once: true });
              }
            }
            requestAnimationFrame(detectMovement);
          }, 50);
        });
      }
      document.ontouchstart = function (e) {
        e.preventDefault();
        var inputs = document.getElementsByTagName("input");
        var len = inputs.length;
        for (let i = 0; i < len; i++) {
          var element = inputs[i]; // the input field

          if (element.getAttribute("listener") !== "true") {
            element.setAttribute("listener", "true");
            element.addEventListener("focus", handleFocus, { once: true });
          }
        }
      };
    },
    canCreateSections(auths) {
      return (
        auths.filter((a) => a.shared_resource_type == "Course" && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role))
          .length > 0
      );
    },
    onAuthAdded(
      previousResult,
      {
        subscriptionData: {
          data: { authCreated },
        },
      }
    ) {
      const newResult = {
        me: {
          ...previousResult.me,
          auths: [...previousResult.me.auths, authCreated],
        },
      };
      if (authCreated.shared_resource_type != "Checkin") {
        this.$refs.nav.initAddAuthToTree(authCreated);
      }
      this.$q.notify({
        progress: true,
        message: "New " + authCreated.shared_resource_type + " added: " + authCreated.shared_resource.name,
        icon: "notifications",
        color: "primary",
      });
      return newResult;
    },
    canCreateGroups(auths) {
      return (
        auths.filter(
          (a) =>
            ["Course", "RegistrationSection"].includes(a.shared_resource_type) &&
            ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
        ).length > 0
      );
    },
    canCreateLectures(auths) {
      return (
        auths.filter(
          (a) =>
            ["Course", "RegistrationSection", "UserGroup"].includes(a.shared_resource_type) &&
            ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
        ).length > 0
      );
    },
    canCreateVideos(auths) {
      return (
        auths.filter(
          (a) => ["Lecture"].includes(a.shared_resource_type) && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
        ).length > 0
      );
    },
    getFormattedDate(d) {
      return date.formatDate(d, "MMM Do, YYYY @ h:mma");
    },
    handleDonate() {
      var win = window.open(
        "https://www.paypal.com/donate/?cmd=_donations&business=ejwhitton43%40gmail.com&currency_code=USD",
        "_blank"
      );
      win.focus();
    },
    handleAPI() {
      var win = window.open(process.env.BASE_URL + "graphql", "_blank");
      win.focus();
    },
    handleScan() {
      this.$router.push({ name: "CheckinScan" });
    },
    generateID() {
      var result = "";
      var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var charactersLength = characters.length;
      for (var i = 0; i < 24; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    },
    handleHost() {
      this.$router.push({ name: "CreateCheckin" });
    },
    tryLogout() {
      if (localStorage.getItem("token")) {
        localStorage.removeItem("token");
        location.reload();
      }
    },
    refresh(on) {
      location.reload();
    },
  },
};
</script>

<style>
#pagescroll .absolute.full-width {
  height: 100%;
}
.toolbar-btns {
  white-space: nowrap;
}
.toolbar-btns > * {
  display: inline-block;
}
</style>

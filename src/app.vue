<template>
  <q-layout id="app" view="lhr Lpr lfr" class="text-primary">
    <q-ajax-bar position="top" color="primary" size="0.25rem" />
    <ApolloQuery :query="require('./graphql/Me.gql')">
      <template slot-scope="{ result: { data, error } }">
        <div v-if="error">{{ tryLogout() }}</div>
        <div v-if="data">
          <q-header class="text-primary">
            <q-pull-to-refresh @refresh="refresh" color="white" bg-color="primary">
              <q-toolbar class="q-pt-md">
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
                <q-toolbar-title v-if="!['Landing', 'Login', 'Signup', 'FirstTimeLogin'].includes($route.name)">
                  <q-avatar @click="$router.push({ name: 'Dashboard' })">
                    <VeneuLogo id="nav-logo" />
                  </q-avatar>
                </q-toolbar-title>

                <q-space />

                <q-btn size="sm" round icon="qr_code_2" class="q-mx-sm" title="Checkin" aria-label="Checkin">
                  <q-menu :offset="[0, 16]">
                    <div class="q-pa-xs">
                      <q-item clickable class="row full-width items-center q-ma-none" @click="handleScan"
                        ><q-icon color="primary" size="sm" name="qr_code_scanner" class="q-mr-sm" />Attend</q-item
                      >
                      <q-item v-if="data.me" clickable class="row full-width items-center q-ma-none" @click="handleHost"
                        ><q-icon color="primary" size="sm" name="present_to_all" class="q-mr-sm" />Host</q-item
                      >
                    </div>
                  </q-menu>
                </q-btn>
                <q-btn v-if="data.me" size="sm" round icon="notifications" class="q-mx-sm" title="API" aria-label="API">
                  <q-badge rounded color="red" floating label="1+" />
                </q-btn>
              </q-toolbar>
            </q-pull-to-refresh>
          </q-header>

          <q-drawer v-if="data.me" show-if-above v-model="left" side="left">
            <q-input borderless v-model="searchString" label="Search..." class="q-ml-md q-mr-md">
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:append v-if="searchString">
                <q-icon name="close" @click="searchString = ''" class="cursor-pointer" />
              </template>
            </q-input>
            <q-item clickable class="rounded-borders" id="me">
              <q-item-section avatar>
                <q-avatar class="spinner">
                  <img src="https://cdn.quasar.dev/img/boy-avatar.png" />
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
                  class="q-mx-sm text-primary"
                  title="Logout"
                  aria-label="Logout"
                  @click="confirmLogout = true"
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
            <div class="row full-width q-px-md q-mt-md">
              <q-btn size="sm" label="New" icon="add" class="full-width">
                <q-menu anchor="bottom middle" self="top middle" :offset="[0, 8]">
                  <q-list class="q-pa-xs text-primary">
                    <q-item class="items-center" title="Checkin" clickable @click="handleHost">
                      <!-- <q-icon color="primary" size="sm" name="present_to_all" class="q-mr-sm" /> -->
                      Checkin
                    </q-item>
                    <q-item class="items-center" title="Course" :to="{ name: 'CreateCourse' }">Course</q-item>
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
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
            <q-list class="text-primary neu-convex q-ma-md q-pa-xs">
              <course-list :me="data.me" />
            </q-list>
            <q-list class="text-primary neu-convex q-ma-md q-pa-xs">
              <q-expansion-item
                icon="qr_code_2"
                label="Check-ins"
                expand-icon-class="text-primary"
                :header-inset-level="0"
                :content-inset-level="0.5"
              >
                <q-list class="rounded-borders">
                  <q-expansion-item
                    icon="present_to_all"
                    label="Hosted"
                    :header-inset-level="0"
                    :content-inset-level="0"
                    expand-icon-class="text-primary"
                  >
                    <ApolloQuery :query="require('./graphql/Checkins.gql')">
                      <template slot-scope="{ result: { loading, error, data } }">
                        <div v-if="error">Error...</div>
                        <div v-else-if="loading">Loading...</div>
                        <q-list v-else-if="data">
                          <q-item
                            class="row items-center justify-center"
                            :clickable="$route.params._id != checkin._id || $route.name != 'CheckinShow'"
                            v-for="checkin in data.checkins"
                            :key="checkin._id"
                            @click="handleHosted(checkin._id)"
                          >
                            {{ getFormattedDate(checkin.created_at) }}
                          </q-item>
                          <q-item v-if="!data.checkins.length" class="row items-center justify-center">
                            None
                          </q-item>
                        </q-list>
                      </template>
                    </ApolloQuery>
                  </q-expansion-item>

                  <q-expansion-item
                    icon="qr_code_scanner"
                    label="Attended"
                    :content-inset-level="0"
                    expand-icon-class="text-primary"
                  >
                    <q-item class="items-center justify-center">
                      <em>Coming soon</em>
                    </q-item>
                  </q-expansion-item>
                </q-list>
              </q-expansion-item>
            </q-list>
            <q-list class="fdsafdsfdsatext-primary neu-convex q-mx-md q-my-md q-pa-xs">
              <q-expansion-item
                icon="assignment"
                label="Assignments"
                expand-icon-class="text-primary"
                :content-inset-level="0.5"
              >
                <q-list class="rounded-borders">
                  <q-expansion-item
                    icon="assignment_late"
                    label="Due"
                    :content-inset-level="0"
                    expand-icon-class="text-primary"
                  >
                    <q-item class="items-center justify-center">
                      <em>Coming soon</em>
                    </q-item>
                  </q-expansion-item>

                  <q-expansion-item
                    icon="assignment_turned_in"
                    label="Complete"
                    :content-inset-level="0"
                    expand-icon-class="text-primary"
                  >
                    <q-item class="items-center justify-center">
                      <em>Coming soon</em>
                    </q-item>
                  </q-expansion-item>
                </q-list>
              </q-expansion-item>
            </q-list>
          </q-drawer>

          <q-page-container class="text-primary">
            <router-view :me="data.me" />
          </q-page-container>
        </div>
      </template>
    </ApolloQuery>
  </q-layout>
</template>

<script>
import { date } from "quasar";
import gql from "graphql-tag";
import VeneuLogo from "./components/VeneuLogo";
import CourseList from "./components/CourseList";
import "quasar/icon-set/fontawesome-v5";
// import "./assets/veneu.css";
export default {
  name: "app",
  components: {
    VeneuLogo,
    CourseList
  },
  data() {
    return {
      left: false,
      searchString: "",
      confirmLogout: false
    };
  },
  methods: {
    canCreateSections(auths) {
      return (
        auths.filter(a => a.shared_resource_type == "Course" && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role))
          .length > 0
      );
    },
    canCreateGroups(auths) {
      return (
        auths.filter(
          a =>
            ["Course", "RegistrationSection"].includes(a.shared_resource_type) &&
            ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
        ).length > 0
      );
    },
    canCreateLectures(auths) {
      return (
        auths.filter(
          a =>
            ["Course", "RegistrationSection", "UserGroup"].includes(a.shared_resource_type) &&
            ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
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
      this.$apollo
        .mutate({
          mutation: gql`
            mutation createCheckin {
              createCheckin {
                _id
              }
            }
          `
        })
        .then(({ data }) => {
          this.$router.push({ name: "CheckinShow", params: { _id: data.createCheckin._id } });
        })
        .catch(e => {
          this.$q.notify({
            progress: true,
            message: "Issue creating a checkin, try again " + e,
            icon: "error",
            color: "negative"
          });
        });
    },
    handleHosted(_id) {
      if (this.$route.name != "CheckinShow" || this.$route.params._id != _id) {
        this.$router.push({ name: "CheckinShow", params: { _id } });
      }
    },
    tryLogout() {
      if (localStorage.getItem("token")) {
        localStorage.removeItem("token");
        location.reload();
      }
    },
    refresh(on) {
      location.reload();
    }
  }
};
</script>

<style></style>

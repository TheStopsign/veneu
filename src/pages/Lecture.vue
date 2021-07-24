<template>
  <q-page class="q-pa-md">
    <ApolloQuery :query="require('../graphql/Lecture.gql')" :variables="{ _id: $route.params._id }">
      <template slot-scope="{ result: { loading, error, data } }">
        <div v-if="loading">Loading...</div>
        <div v-if="error">Error...</div>
        <div v-if="data && data.lecture" id="lectureloaded">
          <div class="q-my-md">
            <h1 class="q-mb-md q-mx-md">{{ data.lecture.name }}</h1>
            <div class="row full-width q-mt-sm q-mb-md">
              <ShareResourceModal
                :resourceid="data.lecture._id"
                resourcetype="Lecture"
                :me="me"
                v-if="hasPermissions()"
              />
            </div>
            <div class="q-px-md">
              {{ getFormattedDate(data.lecture.start) }} - {{ getFormattedDate(data.lecture.end) }}
            </div>
          </div>
          <em class="q-ma-md">
            {{ data.lecture.description ? "Description" + data.lecture.description : "No description" }}
          </em>
          <div v-if="!data.lecture.recording">
            <q-btn
              label="Add Recording"
              icon="theaters"
              icon-right="add"
              size="lg"
              class="q-mt-md"
              :to="{ path: '/create-video?from=' + $route.params._id }"
            />
          </div>
          <div v-else>
            <!-- <q-btn label="Join Live" icon-right="cast" size="lg" class="q-mt-md q-mr-md" /> -->
            <q-btn
              label="Watch Recording"
              icon="theaters"
              icon-right="visibility"
              size="lg"
              class="q-mt-md"
              :to="{ path: getWatchPath(data.lecture.recording) }"
            />
          </div>
          <attendance-table :me="me" v-if="hasPermissions" />
          <div class="row full-width justify-center" v-if="canDelete()">
            <div class="dangerzone">
              <ApolloMutation
                :mutation="require('../graphql/DeleteLecture.gql')"
                :variables="{ _id: data.lecture._id }"
                @done="onDelete"
                class="flex inline"
              >
                <template slot-scope="{ mutate }">
                  <q-dialog v-model="deleteModal" persistent>
                    <q-card class="q-pa-sm">
                      <q-card-section class="row items-center">
                        <q-avatar icon="delete" color="red" text-color="white" />
                        <span class="q-ml-sm">Are you sure? This is <b>permanent</b>.</span>
                      </q-card-section>

                      <q-card-actions>
                        <q-btn label="Cancel" class="text-primary" v-close-popup />
                        <q-space />
                        <q-btn
                          label="Delete"
                          color="white"
                          class="bg-red"
                          v-close-popup
                          @click="mutate()"
                          type="submit"
                        />
                      </q-card-actions>
                    </q-card>
                  </q-dialog>
                  <q-btn class="bg-red text-white" label="Delete" icon-right="delete" @click="deleteModal = true" />
                </template>
              </ApolloMutation>
            </div>
          </div>
        </div>
      </template>
    </ApolloQuery>
  </q-page>
</template>

<script>
import { date } from "quasar";
import ShareResourceModal from "../components/ShareResourceModal.vue";
import AttendanceTable from "../components/AttendanceTable.vue";
export default {
  components: {
    ShareResourceModal,
    AttendanceTable,
  },
  props: {
    me: Object,
  },
  data() {
    return {
      deleteModal: false,
    };
  },
  methods: {
    getWatchPath: (recording) => (recording ? "/watch/" + recording._id : "/watch"),
    getFormattedDate(d) {
      return date.formatDate(d, "MMM Do, YYYY @ h:mma");
    },
    onDelete() {
      this.$router.push({ name: "Dashboard" });
    },
    canDelete() {
      return (
        this.me &&
        this.me.auths.some((a) => a.shared_resource._id == this.$route.params._id && ["INSTRUCTOR"].includes(a.role))
      );
    },
    hasPermissions() {
      return (
        this.me &&
        this.me.auths.some(
          (a) =>
            a.shared_resource._id == this.$route.params._id && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
        )
      );
    },
  },
};
</script>

<style scoped>
.col-12 {
  overflow: auto;
}
</style>

<template>
  <q-page class="q-pa-md">
    <ApolloQuery :query="require('../graphql/RegistrationSection.gql')" :variables="{ _id: $route.params._id }">
      <template slot-scope="{ result: { loading, error, data } }">
        <div v-if="loading">Loading...</div>
        <div v-if="error">Error...</div>
        <div v-if="data && data.registrationSection" id="registrationsectionloaded">
          <div>
            <h1 class="q-pa-sm">{{ data.registrationSection.name }}</h1>
            <div class="row full-width q-my-sm">
              <ShareResourceModal
                :resourceid="data.registrationSection._id"
                resourcetype="RegistrationSection"
                :me="me"
                v-if="canShare()"
              />
            </div>
            <h3 class="q-my-none">Scheduled for...</h3>
            <div
              class="row full-width items-center"
              v-for="(wde, i) in data.registrationSection.meeting_times"
              :key="i"
            >
              <q-icon name="today" size="sm" class="q-mx-sm" /> {{ wde.weekday }}(s) {{ " " }}
              <q-icon name="schedule" size="sm" class="q-mx-sm" /> {{ wde.event.start }} -
              {{ wde.event.end }}
            </div>
            <q-timeline :layout="layout" color="primary" v-if="data.registrationSection.lectures">
              <q-timeline-entry class="text-primary" heading>
                Timeline
              </q-timeline-entry>

              <q-timeline-entry
                :title="'Lecture - ' + lect.name"
                :subtitle="getFormattedDate(lect.start)"
                side="left"
                v-for="lect in getSorted(data.registrationSection.lectures)"
                :key="lect._id"
                icon="class"
              >
                <div>
                  Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore
                  et dolore magna aliqua.
                </div>
              </q-timeline-entry>
            </q-timeline>
            <div class="row full-width justify-center" v-if="canDelete()">
              <div class="dangerzone">
                <ApolloMutation
                  :mutation="require('../graphql/DeleteRegistrationSection.gql')"
                  :variables="{ _id: data.registrationSection._id }"
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
          <!-- <h2 class="q-py-none q-px-sm">Resources</h2>
        <q-tree class="text-primary" :nodes="simple" accordion node-key="label" :expanded.sync="expanded" /> -->
        </div>
      </template>
    </ApolloQuery>
  </q-page>
</template>

<script>
import { date } from "quasar";
import ShareResourceModal from "../components/ShareResourceModal.vue";
export default {
  computed: {
    layout() {
      return this.$q.screen.lt.sm ? "dense" : this.$q.screen.lt.md ? "comfortable" : "loose";
    }
  },
  components: { ShareResourceModal },
  props: {
    me: Object
  },
  data() {
    return {
      deleteModal: false
    };
  },

  methods: {
    getFormattedDate(d) {
      return date.formatDate(d, "MMM Do, YYYY @ h:mma");
    },
    onDelete() {
      location.href = "/dashboard";
    },
    canDelete() {
      return (
        this.me &&
        this.me.auths.some(a => a.shared_resource._id == this.$route.params._id && ["INSTRUCTOR"].includes(a.role))
      );
    },
    canShare() {
      return (
        this.me &&
        this.me.auths.some(
          a => a.shared_resource._id == this.$route.params._id && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
        )
      );
    },
    getSorted(vals) {
      return [...vals].sort(function(a, b) {
        return new Date(a.start) - new Date(b.start);
      });
    }
  }
};
</script>

<style scoped>
.col-12 {
  overflow: auto;
}
</style>

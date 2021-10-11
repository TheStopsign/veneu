<template>
  <q-page class="q-py-md">
    <ApolloQuery :query="require('../graphql/UserGroup.gql')" :variables="{ _id: $route.params._id }">
      <template slot-scope="{ result: { loading, error, data } }">
        <div v-if="loading">Loading...</div>
        <div v-if="error">Error...</div>
        <div v-if="data && data.userGroup" id="registrationsectionloaded">
          <div style="max-width: 60rem; margin: auto">
            <h1 class="q-pa-sm">{{ data.userGroup.name }}</h1>
            <div class="row full-width q-my-sm q-px-md">
              <ShareResourceModal
                :resourceid="data.userGroup._id"
                resourcetype="UserGroup"
                :me="me"
                v-if="hasPermissions()"
              />
            </div>
            <div class="q-my-md">
              <div class="row full-width q-pl-md">
                <ResourceSelector
                  :me="me"
                  label="Additional Resources"
                  :scope="data.userGroup._id"
                  :selectable="me.auths.map((a) => a._id)"
                  class="col-12 col-sm q-mt-md q-pr-md"
                  style="overflow: visible"
                  nav
                />
                <q-timeline
                  :layout="layout"
                  color="primary"
                  class="col-12 col-sm q-mt-md q-pr-md"
                  style="overflow: visible"
                >
                  <q-timeline-entry class="text-primary" heading> Timeline </q-timeline-entry>

                  <q-btn
                    v-if="hasPermissions()"
                    class="row full-width q-my-md"
                    label="Add lecture"
                    :to="{ name: 'CreateLecture', query: { from: data.userGroup._id } }"
                    icon="class"
                  />

                  <q-timeline-entry
                    :title="'Lecture - ' + lect.name"
                    :subtitle="getFormattedDate(lect.start)"
                    side="left"
                    v-for="lect in getSorted(data.userGroup.lectures)"
                    :key="lect._id"
                    icon="class"
                  >
                    <div>ATTENDANCE IF EXISTS</div>
                  </q-timeline-entry>
                </q-timeline>
              </div>
            </div>
            <div class="row full-width justify-center" v-if="canDelete()">
              <div class="dangerzone">
                <ApolloMutation
                  :mutation="require('../graphql/DeleteUserGroup.gql')"
                  :variables="{ _id: data.userGroup._id }"
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
import ResourceSelector from "../components/ResourceSelector";
export default {
  computed: {
    layout() {
      return this.$q.screen.lt.sm ? "dense" : this.$q.screen.lt.md ? "comfortable" : "loose";
    },
  },
  components: { ShareResourceModal, ResourceSelector },
  props: {
    me: Object,
  },
  data() {
    return {
      deleteModal: false,
    };
  },

  methods: {
    getFormattedDate(d) {
      return date.formatDate(d, "MMM Do, YYYY @ h:mma");
    },
    onDelete() {
      location.href = "/calendar";
    },
    canDelete() {
      return (
        this.me &&
        this.me.auths.find((a) => a.shared_resource._id == this.$route.params._id && ["INSTRUCTOR"].includes(a.role))
      );
    },
    hasPermissions() {
      return (
        this.me &&
        this.me.auths.find(
          (a) =>
            a.shared_resource._id == this.$route.params._id && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
        )
      );
    },
    getSorted(vals) {
      return [...vals].sort(function (a, b) {
        return new Date(a.start) - new Date(b.start);
      });
    },
  },
};
</script>

<style scoped>
.col-12 {
  overflow: auto;
}
</style>

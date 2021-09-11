<template>
  <q-page id="course-page" class="q-px-md">
    <ApolloQuery :query="require('../graphql/Course.gql')" :variables="{ _id: $route.params._id }">
      <template slot-scope="{ result: { loading, error, data } }">
        <div v-if="loading">Loading...</div>
        <div v-if="error">Error...</div>
        <div v-if="data && data.course" id="courseloaded" class="q-mb-xl">
          <div style="max-width: 60rem; margin: auto">
            <h1 class="q-pa-sm q-mt-md">{{ data.course.name }}</h1>
            <div class="row full-width q-mt-sm q-mb-md">
              <ShareResourceModal
                :resourceid="data.course._id"
                resourcetype="Course"
                :me="me"
                v-if="hasPermissions()"
              />
            </div>
            <div v-if="data.course.description" class="row full-width">
              {{ data.course.description }}
            </div>
            <q-btn
              v-else-if="hasPermissions()"
              size="md"
              class="row full-width q-my-md"
              label="Add description - coming soon"
              icon="create"
            />
            <q-timeline :layout="layout" color="primary">
              <q-timeline-entry v-if="data.course.lectures && data.course.lectures.length" class="text-primary" heading>
                Timeline
              </q-timeline-entry>

              <q-btn
                v-if="hasPermissions()"
                class="row full-width q-my-md"
                label="Add lecture"
                :to="{ name: 'CreateLecture', query: { from: data.course._id } }"
                icon="class"
              />

              <q-timeline-entry
                :title="'Lecture - ' + lect.name"
                :subtitle="getFormattedDate(lect.start)"
                side="left"
                v-for="lect in getSorted(data.course.lectures)"
                :key="lect._id"
                icon="class"
              >
                <div>ATTENDANCE IF EXISTS</div>
              </q-timeline-entry>
            </q-timeline>
            <div class="row full-width justify-center" v-if="canDelete()">
              <div class="dangerzone">
                <ApolloMutation
                  :mutation="require('../graphql/DeleteCourse.gql')"
                  :variables="{ _id: data.course._id }"
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
    },
  },
  components: { ShareResourceModal },
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
      location.href = "/dashboard";
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

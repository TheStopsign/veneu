<template>
  <q-page class="q-pa-md">
    <ApolloQuery :query="require('../graphql/Lecture.gql')" :variables="{ _id: $route.params._id }">
      <template slot-scope="{ result: { loading, error, data } }">
        <div v-if="loading">Loading...</div>
        <div v-if="error">Error...</div>
        <div v-if="data && data.lecture" id="lectureloaded">
          <div>
            <h1 class="q-pa-sm q-mb-md">{{ data.lecture.name }}</h1>
            {{ getFormattedDate(data.lecture.start) }} - {{ getFormattedDate(data.lecture.end) }}
          </div>
        </div>
      </template>
    </ApolloQuery>
  </q-page>
</template>

<script>
import { date } from "quasar";
export default {
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
    }
  }
};
</script>

<style scoped>
.col-12 {
  overflow: auto;
}
</style>

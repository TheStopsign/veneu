<template>
  <div class="checkinselector q-px-md q-pt-md neu-concave row full-width">
    <ApolloQuery :query="require('../graphql/HostedCheckins.gql')">
      <template slot-scope="{ result: { loading, error, data } }">
        <div v-if="error">Error...</div>
        <div v-else-if="loading">Loading...</div>
        <q-list v-else-if="data">
          <div class="q-mb-sm">{{ label }}</div>
          <q-item
            v-for="checkin in data.checkins.filter((a) => !hidden.includes(a._id))"
            class="row items-center justify-center checkin q-my-md q-py-xs"
            clickable
            :class="selected.includes(checkin._id) ? 'neu-convex' : ''"
            :key="checkin._id"
            @click="handleSelect(checkin._id)"
          >
            {{ getFormattedDate(checkin.created_at) }}
          </q-item>
          <q-item
            v-if="!data.checkins.filter((a) => !hidden.includes(a._id)).length"
            class="row items-center justify-center checkin q-my-md q-py-xs"
          >
            None
          </q-item>
        </q-list>
      </template>
    </ApolloQuery>
  </div>
</template>

<script>
import { date } from "quasar";
import gql from "graphql-tag";
export default {
  props: {
    me: Object,
    hidden: { type: Array, default: () => [] },
    label: {
      required: false,
      type: String,
    },
  },
  data() {
    return {
      selected: [],
    };
  },
  created() {},
  methods: {
    getFormattedDate(d) {
      return date.formatDate(d, "MMM Do, YYYY @ h:mma");
    },
    handleSelect(_id) {
      if (this.selected.includes(_id)) {
        let without = this.selected.filter((a) => a != _id);
        this.$emit("change", without, this.selected);
        this.selected = without;
      } else {
        let withchange = this.selected.concat([_id]);
        this.$emit("change", withchange, this.selected);
        this.selected = withchange;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.q-item {
  min-height: unset !important;
}
</style>

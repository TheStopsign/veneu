<template>
  <div class="checkinselector q-pt-md neu-concave row full-width">
    <ApolloQuery :query="require('../graphql/HostedCheckins.gql')" style="width: 100%">
      <template slot-scope="{ result: { loading, error, data } }">
        <div v-if="error">Error...</div>
        <div v-else-if="loading">Loading...</div>
        <q-list v-else-if="data" style="width: 20rem">
          <div class="q-mb-sm q-mx-md">{{ label }}</div>
          <q-scroll-area
            style="height: 20rem; width: 100%"
            :thumb-style="{
              right: '0.5rem',
              borderRadius: '0.25rem',
              backgroundColor: 'var(--veneu-blue)',
              width: '0.25rem',
              opacity: 1,
            }"
          >
            <q-item
              v-for="checkin in data.checkins.filter((a) => !hidden.includes(a._id))"
              class="checkin justify-center q-ma-md q-py-xs"
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
          </q-scroll-area>
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

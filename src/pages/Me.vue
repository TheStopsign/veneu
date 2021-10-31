<template>
  <q-page id="me-page" style="max-width: 60rem; margin: auto">
    <h1 class="q-mt-lg q-mx-md">{{ me.first_name }} {{ me.last_name }}</h1>
    <h3 class="q-mt-md q-mx-md">{{ me.email }}</h3>
  </q-page>
</template>

<script>
import { date } from "quasar";
export default {
  computed: {
    layout() {
      return this.$q.screen.lt.sm ? "dense" : this.$q.screen.lt.md ? "comfortable" : "loose";
    },
  },
  props: {
    me: Object,
  },
  data() {
    return {};
  },
  methods: {
    getFormattedDate(d) {
      return date.formatDate(d, "MMM Do, YYYY @ h:mma");
    },
  },
};
</script>

<style scoped></style>

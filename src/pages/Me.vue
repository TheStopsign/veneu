<template>
  <q-page id="me-page" style="max-width: 60rem; margin: auto">
    <h1 class="q-mt-lg q-mx-md">{{ me.first_name }} {{ me.last_name }}</h1>
    <h3 class="q-mt-md q-mx-md">{{ me.email }}</h3>
    <div class="row full-width">
      <q-input
        label="Avatar - Bottts"
        placeholder="Change avatar..."
        type="text"
        v-model="bottts"
        standout="bg-primary text-white"
        class="q-ml-md"
      />
      <q-avatar class="q-ml-md" id="me-avatar"></q-avatar>
      <q-btn label="Save" :disabled="!canSaveBottts()" @click="handleUpdateBottts()" class="q-ml-md" size="md" />
    </div>
  </q-page>
</template>

<script>
import { date } from "quasar";
import gql from "graphql-tag";
import { createAvatar } from "@dicebear/avatars";
import * as botttsStyle from "@dicebear/avatars-bottts-sprites";
export default {
  props: {
    me: { type: Object, required: true },
  },
  watch: {
    bottts(val, oldVal) {
      this.getAvatar(this.me, val);
    },
  },
  data() {
    return {
      bottts: this.me.bottts ?? "",
      updatingBottts: false,
    };
  },
  mounted() {
    this.getAvatar(this.me, this.bottts);
  },
  methods: {
    getFormattedDate(d) {
      return date.formatDate(d, "MMM Do, YYYY @ h:mma");
    },
    getAvatar: (me, bottts) => {
      let avatarEl = document.getElementById("me-avatar");
      if (avatarEl) {
        avatarEl.innerHTML = createAvatar(botttsStyle, {
          seed: bottts.length ? bottts : me._id,
        });
      }
    },
    canSaveBottts() {
      return this.me.bottts ? this.me.bottts != this.bottts : this.bottts.length > 0;
    },
    async handleUpdateBottts() {
      this.updatingBottts = true;
      await this.$apollo.mutate({
        mutation: gql`
          mutation updateUser($_id: ID!, $bottts: String) {
            updateUser(_id: $_id, bottts: $bottts) {
              _id
              bottts
            }
          }
        `,
        variables: {
          _id: this.me._id,
          bottts: this.bottts,
        },
      });
      this.updatingBottts = false;
    },
  },
};
</script>

<style scoped></style>

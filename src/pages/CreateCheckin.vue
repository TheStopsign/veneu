<template>
  <q-page id="create-checkin">
    <div class="q-pt-md q-pb-xl q-px-md">
      <q-form class="q-gutter-y-md q-ma-md q-py-md neu-convex">
        <div>
          <i><h1>New Checkin...</h1></i>
        </div>
        <q-input
          standout="bg-primary text-white q-ma-none"
          color="primary"
          class="text-primary q-mx-md q-mt-md"
          v-model="name"
          label="Checkin Name"
          placeholder="e.g. S-2021 01"
        />
        <q-checkbox
          v-model="ticketing_requires_authentication"
          label="Ticketing requires authentication"
          color="primary"
          class="row full-width justify-center"
        />
        <q-checkbox
          v-model="ticketing_requires_authorization"
          label="Ticketing requires authorization"
          color="primary"
          class="row full-width justify-center"
        />
        <q-checkbox
          v-model="ticketing_allows_duplicates"
          label="Ticketing allows more than one entry per user (email)"
          color="primary"
          class="row full-width justify-center"
        />
        <q-bar class="q-pa-none q-ml-md q-pr-md q-gutter-x-md">
          <q-btn label="Back" class="q-ml-sm" @click="handleBack" />
          <q-btn
            color="primary"
            label="Continue"
            class="q-ml-sm full-width"
            :disabled="!formValid()"
            @click="handleSubmit()"
          />
        </q-bar>
      </q-form>
    </div>
  </q-page>
</template>

<script>
import gql from "graphql-tag";
export default {
  name: "CreateCheckin",
  props: {
    me: Object,
  },
  watch: {
    ticketing_requires_authorization(val, oldVal) {
      if (val && !this.ticketing_requires_authentication) {
        this.ticketing_requires_authentication = true;
        this.$q.notify({
          progress: true,
          message: "A required setting has been automatically applied: Authentication",
          icon: "settings",
          color: "primary",
        });
      }
    },
  },
  data() {
    return {
      name: "",
      ticketing_requires_authentication: false,
      ticketing_requires_authorization: false,
      ticketing_allows_duplicates: false,
    };
  },
  methods: {
    handleSubmit() {
      this.$apollo
        .mutate({
          mutation: gql`
            mutation createCheckin(
              $name: String!
              $ticketing_requires_authentication: Boolean
              $ticketing_requires_authorization: Boolean
              $ticketing_allows_duplicates: Boolean
            ) {
              createCheckin(
                name: $name
                ticketing_requires_authentication: $ticketing_requires_authentication
                ticketing_requires_authorization: $ticketing_requires_authorization
                ticketing_allows_duplicates: $ticketing_allows_duplicates
              ) {
                _id
                tickets {
                  email
                  user
                  code
                }
                creator {
                  name
                }
                created_at
                ticketing_requires_authentication
                ticketing_requires_authorization
                ticketing_allows_duplicates
              }
            }
          `,
          variables: {
            name: this.name,
            ticketing_requires_authentication: this.ticketing_requires_authentication,
            ticketing_requires_authorization: this.ticketing_requires_authorization,
            ticketing_allows_duplicates: this.ticketing_allows_duplicates,
          },
        })
        .then(({ data: { createCheckin } }) => {
          this.handleCreateCheckin(createCheckin._id);
        })
        .catch((e) => {
          this.$q.notify({
            progress: true,
            message: "Issue creating a checkin, try again " + e,
            icon: "error",
            color: "negative",
          });
        });
    },
    handleBack() {
      this.$router.go(-1);
    },
    formValid() {
      if (!this.name) {
        return false;
      }
      return true;
    },
    handleCreateCheckin(_id) {
      location.href = "/checkin/" + _id + "/show";
    },
  },
};
</script>

<style scoped></style>

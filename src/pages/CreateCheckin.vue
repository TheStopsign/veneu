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
        <WYSIWYG v-model="description" placeholder="Add a description..." class="q-mx-md" />
        <ResourceSelector
          v-model="selected_auth"
          :me="me"
          label="Checkin for..."
          :selectable="
            me.auths
              .filter((a) => ['Course', 'RegistrationSection', 'UserGroup', 'Lecture'].includes(a.shared_resource_type))
              .map((a) => a._id)
              .concat([me._id])
          "
          class="q-mx-md"
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
import WYSIWYG from "../components/WYSIWYG.vue";
import ResourceSelector from "../components/ResourceSelector.vue";
export default {
  name: "CreateCheckin",
  components: { WYSIWYG, ResourceSelector },
  props: {
    me: { type: Object, required: true },
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
    selected_auth: function (val) {
      this.selected_auth = val ?? {
        shared_resource: {
          _id: null,
        },
        shared_resource_type: null,
      };
    },
  },
  data() {
    return {
      name: "",
      ticketing_requires_authentication: false,
      ticketing_requires_authorization: false,
      ticketing_allows_duplicates: false,
      description: "",
      selected_auth: {
        shared_resource: {
          _id: null,
        },
        shared_resource_type: null,
      },
    };
  },
  methods: {
    handleSubmit() {
      this.$apollo
        .mutate({
          mutation: gql`
            mutation createCheckin(
              $name: String!
              $description: String
              $ticketing_requires_authentication: Boolean
              $ticketing_requires_authorization: Boolean
              $ticketing_allows_duplicates: Boolean
              $parent_resource: ID
              $parent_resource_type: String
            ) {
              createCheckin(
                name: $name
                description: $description
                ticketing_requires_authentication: $ticketing_requires_authentication
                ticketing_requires_authorization: $ticketing_requires_authorization
                ticketing_allows_duplicates: $ticketing_allows_duplicates
                parent_resource: $parent_resource
                parent_resource_type: $parent_resource_type
              ) {
                _id
                name
                description
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
            description: this.description,
            ticketing_requires_authentication: this.ticketing_requires_authentication,
            ticketing_requires_authorization: this.ticketing_requires_authorization,
            ticketing_allows_duplicates: this.ticketing_allows_duplicates,
            parent_resource: this.selected_auth.shared_resource._id ?? this.me._id,
            parent_resource_type: this.selected_auth.shared_resource_type ?? "User",
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

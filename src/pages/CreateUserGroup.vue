<template>
  <q-page id="create-course">
    <ApolloMutation
      :mutation="require('../graphql/CreateUserGroup.gql')"
      :variables="{
        name,
        parent_resource: selected_auth.shared_resource._id,
        parent_resource_type: selected_auth.shared_resource_type,
      }"
      class="form q-pb-xl"
      @done="handleCreateUserGroup"
    >
      <template slot-scope="{ mutate }">
        <q-form @submit.prevent="formValid && mutate()" class="q-gutter-y-lg q-ma-md q-py-md">
          <div>
            <i><h1 class="q-px-md">Create a New Group</h1></i>
          </div>
          <q-input
            standout="bg-primary text-white q-ma-none"
            color="primary"
            class="text-primary q-mt-none q-mx-md q-mt-lg"
            v-model="name"
            label="Group Name"
            placeholder="e.g. Team 2"
          >
          </q-input>
          <ResourceSelector
            :me="me"
            label="For Resource..."
            :selectable="
              me.auths
                .filter((a) => ['Course', 'RegistrationSection', 'UserGroup'].includes(a.shared_resource_type))
                .map((a) => a._id)
            "
            class="q-px-md q-mt-lg"
            v-model="selected_auth"
          />
          <q-bar class="q-py-none q-px-md q-mt-lg">
            <q-btn type="button" label="Back" class="q-mr-md" @click="handleBack" />
            <q-btn type="submit" color="primary" label="Continue" class="full-width" :disable="!formValid()" />
          </q-bar>
        </q-form>
      </template>
    </ApolloMutation>
  </q-page>
</template>

<script>
import ResourceSelector from "../components/ResourceSelector";
export default {
  name: "CreateUserGroup",
  components: {
    ResourceSelector,
  },
  props: {
    me: Object,
  },
  watch: {
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
      selected_auth: {
        shared_resource: {
          _id: null,
        },
        shared_resource_type: null,
      },
    };
  },
  methods: {
    handleBack() {
      this.$router.go(-1);
    },
    formValid() {
      return this.name.length && this.selected_auth.shared_resource._id && this.selected_auth.shared_resource_type;
    },
    handleCreateUserGroup() {
      this.name = "";
      this.parent_resource = null;
      this.$router.push({ name: "Calendar" });
    },
  },
};
</script>

<style scoped>
#actions {
  position: relative;
  display: block;
  width: 100%;
  text-align: right;
}
/* button {
  margin: 1rem 0rem 0rem 0rem;
} */
.spinner {
  width: 14rem;
  margin: auto;
}
#signup-stepper {
  width: 100%;
  margin: 2rem auto;
  border-radius: 1rem !important;
  background: unset;
}
.q-stepper__nav {
  border-radius: 1rem;
}
</style>

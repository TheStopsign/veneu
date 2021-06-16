<template>
  <q-page id="create-course" class="q-pa-md">
    <ApolloMutation
      :mutation="require('../graphql/CreateYTVideoStream.gql')"
      :variables="{ url, name, parent_resource, parent_resource_type }"
      class="form q-pb-md"
      @done="handleCreateVideo"
    >
      <template slot-scope="{ mutate }">
        <q-form @submit.prevent="mutate()" class="q-gutter-md q-ma-md q-py-md q-pt-lg neu-convex">
          <div>
            <i><h1>Create a New Video</h1></i>
          </div>
          <ResourceSelector
            :me="me"
            label="For Lecture..."
            :selectable="me.auths.filter(a => a.shared_resource_type === 'Lecture').map(a => a._id)"
            @change="handleChangeLecture"
            class="q-mt-md"
          />
          <q-input
            standout="bg-primary text-white q-ma-none"
            color="primary"
            class="text-primary q-mt-none"
            v-model="name"
            label="Video Name"
            placeholder="e.g. Syllabus Day Recording"
          />
          <q-input
            standout="bg-primary text-white q-ma-none"
            color="primary"
            class="text-primary q-mt-md"
            v-model="url"
            label="YouTube Link"
            placeholder="e.g. https://www.youtube.com/watch?v=tz56ac6BaJQ"
          />
          <q-bar class="q-pa-none q-gutter-x-md">
            <q-btn label="Back" class="q-ml-sm" @click="handleBack" />
            <q-btn type="submit" color="primary" label="Continue" class="q-ml-sm full-width" :disabled="!formValid()" />
          </q-bar>
        </q-form>
      </template>
    </ApolloMutation>
  </q-page>
</template>

<script>
import ResourceSelector from "../components/ResourceSelector";
export default {
  name: "CreateRegistrationSection",
  props: {
    me: Object
  },
  components: {
    ResourceSelector
  },
  data() {
    return {
      name: "",
      url: "",
      parent_resource: null,
      parent_resource_type: "Lecture"
    };
  },
  methods: {
    handleBack() {
      this.$router.go(-1);
    },
    formValid() {
      if (!this.parent_resource || !this.parent_resource_type) {
        return false;
      }
      if (
        !this.me.auths.find(a => a.shared_resource._id == this.parent_resource && a.shared_resource_type == "Lecture")
      ) {
        return false;
      }
      if (!this.name.length) {
        return false;
      }
      if (!this.url.length) {
        return false;
      }
      return true;
    },
    toTitleCase(str) {
      return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    },
    handleCreateVideo() {
      this.name = "";
      this.url = "";
      this.$router.push({ name: "Dashboard" });
    },
    handleChangeLecture(parent_resource) {
      this.parent_resource = parent_resource;
    }
  }
};
</script>

<style scoped></style>

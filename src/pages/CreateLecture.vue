<template>
  <q-page id="create-course" class="q-pa-md">
    <div class="q-pb-md">
      <q-form class="q-gutter-md q-ma-md q-py-md neu-convex form q-mb-lg">
        <div>
          <i><h1>Create a New Lecture</h1></i>
        </div>
        <ResourceSelector :me="me" label="For Resource..." @change="handleChangeResource" class="q-mt-md" />
        <q-input
          standout="bg-primary text-white q-ma-none"
          color="primary"
          class="text-primary q-mt-none"
          v-model="name"
          label="Lecture Name"
          placeholder="e.g. S-2021 01"
        >
        </q-input>
        <div class="row full-width q-px-md q-py-md">
          <q-date
            v-model="date"
            mask="YYYY-MM-DD"
            color="primary"
            class="col-12 neu-convex"
            subtitle="What day is the lecture on?"
          />
        </div>
        <div class="row full-width q-px-md items-center justify-center">
          What are the start and end times?
        </div>
        <div class="row full-width q-px-md q-pb-md">
          <q-time v-model="start" color="primary" mask="HH:mm Z" class="col-12 col-sm q-mr-md neu-convex q-mt-md" />
          <q-time v-model="end" color="primary" mask="HH:mm Z" class="col-12 col-sm neu-convex q-mt-md" />
        </div>
        <q-bar class="q-pa-none q-gutter-x-md">
          <q-btn label="Back" class="q-ml-sm" @click="handleBack" />
          <q-btn
            color="primary"
            label="Continue"
            class="q-ml-sm full-width"
            :disabled="!formValid()"
            @click="handleSubmit() && mutate()"
          />
        </q-bar>
      </q-form>
    </div>
  </q-page>
</template>

<script>
import gql from "graphql-tag";
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
      date: null,
      parent_resource: null,
      parent_resource_type: null,
      start: "",
      end: ""
    };
  },
  methods: {
    handleSubmit() {
      this.start = this.date + " " + this.start;
      this.end = this.date + " " + this.end;
      this.$apollo
        .mutate({
          mutation: gql`
            mutation createLecture(
              $name: String!
              $parent_resource: ID!
              $parent_resource_type: String!
              $start: Date!
              $end: Date!
            ) {
              createLecture(
                name: $name
                parent_resource: $parent_resource
                parent_resource_type: $parent_resource_type
                start: $start
                end: $end
              ) {
                _id
                name
                type
                start
                end
                auths {
                  _id
                  role
                  user {
                    _id
                    first_name
                    last_name
                  }
                }
                parent_resource {
                  ... on SharedResource {
                    _id
                    name
                    type
                  }
                }
                parent_resource_type
              }
            }
          `,
          variables: {
            name: this.name,
            parent_resource: this.parent_resource,
            parent_resource_type: this.parent_resource_type,
            start: this.start,
            end: this.end
          }
        })
        .then(({ data: { createLecture } }) => {
          this.handleCreateLecture();
        });
    },
    handleBack() {
      this.$router.go(-1);
    },
    formValid() {
      if (!this.parent_resource || !this.parent_resource_type) {
        return false;
      }
      if (!this.name) {
        return false;
      }
      if (!this.date || !this.start || !this.end || this.start > this.end) {
        return false;
      }
      return true;
    },
    handleCreateLecture() {
      location.href = "/dashboard";
    },
    handleChangeResource(resource, type) {
      this.parent_resource = resource;
      let a = this.me.auths.find(a => a.shared_resource._id == resource);
      if (a) {
        this.parent_resource_type = a.shared_resource_type;
      }
    }
  }
};
</script>

<style scoped></style>

<template>
  <q-page id="create-lecture">
    <div class="q-pt-md q-pb-xl">
      <q-form class="q-gutter-y-lg q-ma-md">
        <div>
          <i><h1 class="q-px-md">New Lecture...</h1></i>
        </div>
        <q-input
          standout="bg-primary text-white q-ma-none"
          color="primary"
          class="text-primary q-mx-md q-mt-lg"
          v-model="name"
          label="Lecture Name"
          placeholder="e.g. S-2021 01"
        />
        <ResourceSelector
          :me="me"
          label="For Resource..."
          v-model="selected_auth"
          :selected="parent_resource"
          :selectable="
            me.auths
              .filter((a) => ['Course', 'UserGroup', 'RegistrationSection'].includes(a.shared_resource_type))
              .map((a) => a._id)
          "
          class="q-px-md q-mt-lg"
        />
        <div class="row full-width q-px-md q-py-md">
          <q-date
            v-model="date"
            mask="YYYY-MM-DD"
            color="primary"
            class="col-12"
            subtitle="What day is the lecture on?"
          />
        </div>
        <div class="row full-width q-px-md items-center justify-center">What are the start and end times?</div>
        <div class="row full-width q-pl-md q-pb-md">
          <div class="col-12 col-sm q-pr-md q-mt-md">
            <div class="row full-width q-px-none">
              <q-input
                standout="primary"
                v-model="start"
                :rules="['HH:mm Z']"
                label="Start Time"
                disable
                class="col-9 q-pb-none"
              />
              <div class="col-3 q-pl-md q-mt-sm">
                <div class="row full-width full-height items-center">
                  <q-btn class="row full-width q-mb-lg" type="button" icon="access_time">
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-time v-model="start" mask="HH:mm Z" color="primary">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" />
                        </div>
                      </q-time>
                    </q-popup-proxy>
                  </q-btn>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm q-pr-md q-mt-md">
            <div class="row full-width q-px-none">
              <q-input
                standout="primary"
                v-model="end"
                :rules="['HH:mm Z']"
                label="End Time"
                disable
                class="col-9 q-pb-none"
              />
              <div class="col-3 q-pl-md q-mt-sm">
                <div class="row full-width full-height items-center">
                  <q-btn class="row full-width q-mb-lg" type="button" icon="access_time">
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-time v-model="end" mask="HH:mm Z" color="primary">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" />
                        </div>
                      </q-time>
                    </q-popup-proxy>
                  </q-btn>
                </div>
              </div>
            </div>
          </div>
        </div>
        <q-bar class="q-px-none q-px-md q-mt-md">
          <q-btn label="Back" class="q-mr-md" @click="handleBack" />
          <q-btn
            color="primary"
            label="Continue"
            class="full-width"
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
  name: "CreateLecture",
  props: {
    me: Object,
  },
  components: {
    ResourceSelector,
  },
  watch: {
    selected_auth: function (val, oldVal) {
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
      date: null,
      parent_resource: this.$route.query.from ?? null,
      selected_auth: {
        shared_resource: {
          _id: null,
        },
        shared_resource_type: null,
      },
      start: "",
      end: "",
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
            parent_resource: this.selected_auth.shared_resource._id,
            parent_resource_type: this.selected_auth.shared_resource_type,
            start: this.start,
            end: this.end,
          },
        })
        .then(({ data: { createLecture } }) => {
          this.handleCreateLecture();
        });
    },
    handleBack() {
      this.$router.go(-1);
    },
    formValid() {
      if (!this.selected_auth.shared_resource._id || !this.selected_auth.shared_resource_type) {
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
      this.$router.push({ name: "Calendar" });
    },
  },
};
</script>

<style scoped></style>

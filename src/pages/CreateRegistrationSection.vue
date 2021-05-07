<template>
  <q-page id="create-course" class="q-pa-md">
    <ApolloMutation
      :mutation="require('../graphql/CreateRegistrationSection.gql')"
      :variables="{ name, course, meeting_times }"
      class="form q-pb-md"
      @done="handleCreateRegistrationSection"
    >
      <template slot-scope="{ mutate }">
        <q-form @submit.prevent="mutate()" class="q-gutter-md q-ma-md q-py-md q-pt-lg neu-convex">
          <div>
            <i><h1>Create a New Registration Section</h1></i>
          </div>
          <ResourceSelector
            :me="me"
            label="For Course..."
            :selectable="me.auths.filter(a => a.shared_resource_type === 'Course').map(a => a._id)"
            @change="handleChangeCourse"
            class="q-mt-md"
          />
          <q-input
            standout="bg-primary text-white q-ma-none"
            color="primary"
            class="text-primary q-mt-none"
            v-model="name"
            label="Section Name"
            placeholder="e.g. S-2021 01"
          >
          </q-input>
          <div class="row full-width q-px-md q-pb-md" v-for="(weekdayevent, i) in meeting_times" :key="i">
            <q-select
              standout="bg-primary text-white q-ma-none"
              class="col-10 q-mb-md q-mt-sm"
              :options="['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']"
              label="Day of the week"
              v-model="weekdayevent.weekday"
              @input="
                sel => {
                  weekdayevent.event.name = toTitleCase(sel + ' Meeting');
                }
              "
            />
            <div class="col-2 q-pl-md q-mt-sm">
              <div class="row full-width full-height items-center">
                <q-btn
                  label=""
                  icon="delete"
                  class="row full-width q-mb-md bg-red text-white"
                  @click="meeting_times.splice(i, 1)"
                />
              </div>
            </div>

            <q-time
              v-model="weekdayevent.event.start"
              color="primary"
              class="col-12 col-sm q-mr-md q-mt-md neu-convex"
              label="Start"
            />
            <q-time v-model="weekdayevent.event.end" color="primary" class="col-12 col-sm neu-convex q-mt-md" />
          </div>
          <div class="row full-width q-px-md">
            <q-btn label="Add a weekly meeting time" class="row full-width" @click="handleAddMeeting" />
          </div>
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
      course: null,
      meeting_times: []
    };
  },
  methods: {
    handleBack() {
      this.$router.go(-1);
    },
    formValid() {
      if (!this.course) {
        return false;
      }
      if (!this.name.length) {
        return false;
      }
      if (this.meeting_times.length) {
        if (
          this.meeting_times.some(
            time =>
              !(
                time.weekday &&
                time.event.start &&
                time.event.end &&
                time.event.name &&
                time.event.start <= time.event.end
              )
          )
        ) {
          return false;
        }
        return true;
      }
      return true;
    },
    toTitleCase(str) {
      return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    },
    handleCreateRegistrationSection() {
      this.name = "";
      this.course = null;
      this.$router.push({ name: "Dashboard" });
    },
    handleAddMeeting() {
      this.meeting_times.push({
        weekday: "",
        event: {
          start: "",
          end: "",
          name: ""
        }
      });
    },
    handleChangeCourse(course) {
      this.course = course;
    }
  }
};
</script>

<style scoped></style>

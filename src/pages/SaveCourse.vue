<template>
  <q-page :id="original ? 'edit-course' : 'save-course'">
    <q-form @submit.prevent="handleSaveCourse" class="q-ma-md q-px-md q-pt-lg q-pb-xl">
      <div>
        <i
          ><h1>{{ original ? "Editing " + original.name : "New Course..." }}</h1></i
        >
      </div>
      <q-input
        standout="bg-primary text-white q-ma-none"
        color="primary"
        class="text-primary q-mt-lg"
        v-model="name"
        label="Name"
        placeholder="e.g. Computer Science I"
      >
      </q-input>

      <WYSIWYG v-model="description" placeholder="Add a description..." class="q-mt-lg" />

      <div class="row full-width">
        <q-input
          type="text"
          standout="bg-primary text-white"
          color="primary"
          v-model="prefix"
          label="Department"
          placeholder="e.g. CSCI"
          class="col-12 col-sm q-mt-lg q-mr-md"
        >
          <template v-slot:prepend>
            <q-icon name="sort_by_alpha" />
          </template>
        </q-input>
        <q-input
          type="number"
          standout="bg-primary text-white"
          color="primary"
          v-model="suffix"
          label="Number"
          placeholder="e.g. 101"
          class="col-12 col-sm q-mt-lg"
        >
          <template v-slot:prepend>
            <q-icon name="pin" />
          </template>
        </q-input>
      </div>

      <div class="row full-width q-mt-md q-pt-none">
        <q-date v-model="start" class="col-12 col-sm q-mt-md q-mr-md" subtitle="Start date" />
        <q-date v-model="end" class="col-12 col-sm q-mt-md" subtitle="End date" />
      </div>
      <q-bar class="q-pa-none q-gutter-x-md q-mt-lg q-pl-md save-actions">
        <q-btn flat color="primary" @click="handleBack" label="Back" />
        <q-btn type="submit" color="primary" label="Finish" class="full-width" :disabled="formValid() ? false : true" />
      </q-bar>
    </q-form>
  </q-page>
</template>

<script>
import { date } from "quasar";
import WYSIWYG from "../components/WYSIWYG.vue";
import UPDATECOURSE_QUERY from "../graphql/UpdateCourse.gql";
import CREATECOURSE_QUERY from "../graphql/CreateCourse.gql";
export default {
  name: "SaveCourse",
  components: { WYSIWYG },
  props: {
    original: {
      type: Object,
      required: false,
    },
  },
  data() {
    return {
      name: this.original ? this.original.name : "",
      prefix: this.original ? this.original.prefix : "",
      suffix: this.original ? this.original.suffix : null,
      start: this.original ? this.getFormattedDate(new Date(this.original.start)) : "",
      end: this.original ? this.getFormattedDate(new Date(this.original.end)) : "",
      description: this.original ? this.original.description : "",
    };
  },
  created() {
    if (this.$route.name == "EditCourse" && !this.original) {
      this.$router.go(-1);
    }
  },
  methods: {
    getFormattedDate(d) {
      return d ? date.formatDate(d, "YYYY/MM/DD") : "";
    },
    handleBack() {
      this.$router.go(-1);
    },
    formValid() {
      return this.name.length && this.prefix.length && this.suffix && this.start.length && this.end.length;
    },
    handleSaveCourse() {
      if (this.formValid()) {
        if (this.original) {
          let patch = {};
          ["name", "prefix", "suffix", "start", "end", "description"].forEach((key) => {
            if (this.original[key] != this[key]) {
              patch[key] = this[key];
            }
          });

          console.log(patch);

          this.$apollo
            .mutate({
              mutation: UPDATECOURSE_QUERY,
              variables: {
                _id: this.original._id,
                ...patch,
              },
            })
            .then(() => {
              this.$router.go(-1);
            });
        } else {
          this.$apollo
            .mutate({
              mutation: CREATECOURSE_QUERY,
              variables: {
                name: this.name,
                prefix: this.prefix,
                suffix: this.suffix,
                start: this.start,
                end: this.end,
                description: this.description,
              },
            })
            .then(({ data }) => {
              this.$router.push({ name: "Course", params: { _id: data.createCourse._id } });
            });
        }
      }
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
.save-actions {
  padding-right: 0 !important;
}
/* button {
  margin: 1rem 0rem 0rem 0rem;
} */
</style>

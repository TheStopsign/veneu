<template>
  <q-page id="create-course" class="q-pa-md">
    <ApolloMutation
      :mutation="require('../graphql/CreateCourse.gql')"
      :variables="{ name, prefix, suffix, start, end, description }"
      class="form q-pb-md"
      @done="handleCreateCourse"
    >
      <template slot-scope="{ mutate }">
        <q-form @submit.prevent="formValid && mutate()" class="q-ma-md q-pa-md q-pt-lg neu-convex">
          <div>
            <i><h1>New Course...</h1></i>
          </div>
          <q-input
            standout="bg-primary text-white q-ma-none"
            color="primary"
            class="text-primary q-mt-md"
            v-model="name"
            label="Name"
            placeholder="e.g. Computer Science I"
          >
          </q-input>

          <q-input
            standout="bg-primary text-white q-ma-none"
            color="primary"
            class="text-primary q-mt-md"
            v-model="description"
            label="Description"
            placeholder="e.g. Learning about x, y, and z."
            type="textarea"
          >
          </q-input>

          <q-input
            type="text"
            standout="bg-primary text-white"
            color="primary"
            v-model="prefix"
            label="Department"
            placeholder="e.g. CSCI"
            class="q-mt-lg"
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
            class="q-mt-md"
          >
            <template v-slot:prepend>
              <q-icon name="pin" />
            </template>
          </q-input>

          <div class="row full-width q-mt-sm q-pt-none">
            <q-date dense v-model="start" class="col-12 col-sm q-mt-md q-mr-md neu-convex" subtitle="Start date" />
            <q-date dense v-model="end" class="col-12 col-sm q-mt-md neu-convex" subtitle="End date" />
          </div>
          <q-bar class="q-pa-none q-gutter-x-md q-mt-md q-pl-md">
            <q-btn flat color="primary" @click="handleBack" label="Back" />
            <q-btn
              type="submit"
              color="primary"
              label="Finish"
              class="full-width"
              :disabled="formValid() ? false : true"
            />
          </q-bar>
        </q-form>
      </template>
    </ApolloMutation>
  </q-page>
</template>

<script>
export default {
  name: "CreateCourse",
  data() {
    return {
      name: "",
      prefix: "",
      suffix: null,
      start: "",
      end: "",
      description: ""
    };
  },
  methods: {
    handleBack() {
      this.$router.go(-1);
    },
    formValid() {
      return (
        this.name.length &&
        this.prefix.length &&
        this.suffix &&
        this.start.length &&
        this.end.length &&
        this.description.length
      );
    },
    handleCreateCourse({ data }) {
      this.$router.push({ name: "Course", params: { _id: data.createCourse._id } });
    }
  }
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
</style>

<template>
  <div id="first_login" class="container">
    <div class="vertical-center q-px-md">
      <VeneuLogo class="spinner" />
      <ApolloMutation
        :mutation="require('../graphql/FirstLogin.gql')"
        :variables="{ access_code, first_name, last_name, password }"
        class="form"
        @done="handleLogin"
      >
        <template slot-scope="{ mutate }">
          <q-form @submit.prevent="formValid && mutate()" class="q-gutter-y-md q-pa-md q-ma-md neu-convex">
            <div>
              <i><h1>Continue setting up...</h1></i>
            </div>
            <q-input
              type="password"
              standout="bg-primary text-white"
              color="primary"
              v-model="password"
              label="Password"
              class="q-mt-md"
            >
              <template v-slot:prepend>
                <q-icon name="password" />
              </template>
            </q-input>

            <q-input
              type="password"
              standout="bg-primary text-white"
              color="primary"
              v-model="password2"
              label="Repeat Password"
              class="text-primary q-mb-lg"
            >
              <template v-slot:prepend>
                <q-icon name="password" />
              </template>
            </q-input>

            <q-input
              standout="bg-primary text-white"
              color="primary"
              class="text-primary"
              v-model="first_name"
              label="First Name"
            />

            <q-input
              standout="bg-primary text-white"
              color="primary"
              class="text-primary"
              v-model="last_name"
              label="Last / Family Name"
            />

            <q-bar class="bg-none q-pa-none q-gutter-x-md q-gutter-y-none q-pl-md">
              <q-btn label="Back" type="reset" color="primary" flat @click="handleBack" />
              <q-btn label="Submit" type="submit" color="primary" icon-right="check" class="q-ml-sm full-width" />
            </q-bar>
          </q-form>
        </template>
      </ApolloMutation>
    </div>
  </div>
</template>

<script>
import VeneuLogo from "../components/VeneuLogo";
export default {
  name: "FirstLogin",
  components: {
    VeneuLogo
  },
  data() {
    return {
      access_code: this.$route.params.access_code,
      first_name: "",
      last_name: "",
      password: "",
      password2: ""
    };
  },
  methods: {
    formValid() {
      return this.first_name && this.last_name && this.password && this.password2 && this.password == this.password2;
    },
    handleLogin(res) {
      if (res && res.data && res.data.firstLogin) {
        this.$router.push({ name: "Login" });
      }
    },
    handleBack() {
      this.$router.push({ name: "Landing" });
    }
  }
};
</script>

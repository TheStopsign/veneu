<template>
  <q-page id="login-page" class="container">
    <div class="vertical-center">
      <VeneuLogo class="spinner" />
      <ApolloMutation
        :mutation="require('../graphql/CreateUser.gql')"
        :variables="{ email }"
        class="form q-px-md"
        @done="handleSignup"
      >
        <template slot-scope="{ mutate }">
          <q-form @submit.prevent="formValid && mutate()" class="q-gutter-y-md q-pa-md q-ma-md neu-convex">
            <div>
              <i><h1>Signup</h1></i>
            </div>
            <q-input
              standout="bg-primary text-white"
              color="primary"
              class="text-primary q-pa-none q-ma-none q-mt-md"
              v-model="email"
              label="Email"
            >
              <template v-slot:prepend>
                <q-icon name="email" />
              </template>
            </q-input>
            <q-bar class="bg-none q-pa-none q-gutter-x-md q-gutter-y-none q-pl-md">
              <q-btn label="Back" type="reset" color="primary" flat @click="handleBack" />
              <q-btn label="Submit" type="submit" color="primary" icon-right="check" class="q-ml-sm full-width" />
            </q-bar>
          </q-form>
        </template>
      </ApolloMutation>
    </div>
  </q-page>
</template>

<script>
import VeneuLogo from "../components/VeneuLogo";
export default {
  name: "Signup",
  components: {
    VeneuLogo
  },
  data() {
    return {
      email: ""
    };
  },
  methods: {
    formValid() {
      return this.isValidEmail(this.email);
    },
    isValidEmail(val) {
      const emailPattern = /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/;
      if (emailPattern.test(val)) {
        return true;
      } else {
        return false;
      }
    },
    handleSignup(res) {
      this.$q.notify({
        progress: true,
        message: "Please follow the link sent to: " + this.email,
        icon: "email",
        color: "primary"
      });
      this.$router.push({ name: "Landing" });
    },
    handleBack() {
      this.$router.push({ name: "Landing" });
    }
  }
};
</script>

<style scoped>
#login-page {
  text-align: center;
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: auto;
}
h1 {
  padding: 0;
  margin: 0;
}
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

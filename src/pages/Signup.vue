<template>
  <q-page id="signup-page">
    <VeneuLogo />
    <ApolloMutation
      :mutation="require('../graphql/CreateUser.gql')"
      :variables="{ email }"
      class="form q-pb-xl"
      @done="handleSignup"
    >
      <template slot-scope="{ mutate }">
        <q-form @submit.prevent="formValid && mutate()" class="q-gutter-y-lg q-px-md">
          <div>
            <i><h1>Signup</h1></i>
          </div>
          <q-input
            standout="bg-primary text-white"
            color="primary"
            class="text-primary q-pa-none q-ma-none q-mt-lg"
            v-model="email"
            label="Email"
            @focus="onFocus()"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>
          <q-bar class="bg-none q-pa-none">
            <q-btn label="Back" type="reset" color="primary" flat @click="handleBack" class="q-mr-md" />
            <q-btn label="Submit" type="submit" color="primary" icon-right="check" class="full-width" />
          </q-bar>
        </q-form>
      </template>
    </ApolloMutation>
  </q-page>
</template>

<script>
import VeneuLogo from "../components/VeneuLogo";
export default {
  name: "Signup",
  components: {
    VeneuLogo,
  },
  data() {
    return {
      email: "",
    };
  },
  methods: {
    onFocus() {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
    },
    formValid() {
      return this.isValidEmail(this.email);
    },
    isValidEmail(val) {
      const emailPattern =
        /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/;
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
        color: "primary",
      });
      this.$router.push({ name: "Landing" });
    },
    handleBack() {
      this.$router.push({ name: "Landing" });
    },
  },
};
</script>

<style scoped>
.form {
  margin-bottom: 16px;
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

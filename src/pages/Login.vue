<template>
  <q-page id="login-page">
    <VeneuLogo />
    <ApolloMutation
      :mutation="require('../graphql/Login.gql')"
      :variables="{ email, password }"
      class="form q-pb-xl"
      @done="handleLogin"
    >
      <template slot-scope="{ mutate }">
        <q-form @submit.prevent="formValid && mutate()" class="q-gutter-y-lg q-px-md">
          <div>
            <i><h1>Login</h1></i>
          </div>
          <q-input standout="bg-primary text-white" color="primary" v-model="email" label="Email" class="q-mt-lg">
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>
          <q-input type="password" standout="bg-primary text-white" color="primary" v-model="password" label="Password">
            <template v-slot:prepend>
              <q-icon name="password" />
            </template>
          </q-input>

          <q-bar class="bg-none q-pa-none q-gutter-y-none">
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
  name: "Login",
  components: {
    VeneuLogo,
  },
  data() {
    return {
      email: "",
      password: "",
    };
  },
  methods: {
    formValid() {
      return (
        this.email != "" &&
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(this.email) &&
        this.password.length
      );
    },
    handleLogin(res) {
      if (res && res.data && res.data.login) {
        window.localStorage.setItem("token", res.data.login);
        location.href = this.$router.history.current.query.redirect || "/calendar";
      }
      (this.email = ""), (this.password = "");
    },
    handleBack() {
      this.$router.push({ name: "Landing" });
    },
  },
};
</script>

<style scoped>
h1 {
  padding: 0;
  margin: 0;
}

.form {
  margin: auto;
  width: 100%;
  /* max-width: 28rem; */
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
</style>

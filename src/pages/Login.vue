<template>
  <q-page id="login-page" class="container">
    <div class="vertical-center">
      <VeneuLogo class="spinner" />
      <ApolloMutation
        :mutation="require('../graphql/Login.gql')"
        :variables="{ email, password }"
        class="form q-px-md q-pb-md"
        @done="handleLogin"
      >
        <template slot-scope="{ mutate }">
          <q-form @submit.prevent="formValid && mutate()" class="q-gutter-y-md q-pa-md q-ma-md neu-convex">
            <div>
              <i><h1>Login</h1></i>
            </div>
            <q-input standout="bg-primary text-white" color="primary" v-model="email" label="Email" class="q-mt-md">
              <template v-slot:prepend>
                <q-icon name="email" />
              </template>
            </q-input>
            <q-input
              type="password"
              standout="bg-primary text-white"
              color="primary"
              v-model="password"
              label="Password"
            >
              <template v-slot:prepend>
                <q-icon name="password" />
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
  name: "Login",
  components: {
    VeneuLogo
  },
  data() {
    return {
      email: "",
      password: ""
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
      }
      (this.email = ""), (this.password = "");
      location.href = this.$router.history.current.query.redirect || "/dashboard";
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

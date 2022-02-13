<template>
  <q-page id="landing-page">
    <VeneuLogo />
    <!-- <img alt="Veneu Logo" src="../assets/veneu-logo.svg" /> -->
    <div>
      <h1>veneu</h1>
    </div>
    <q-bar id="landing-actions" class="q-ma-md q-mt-lg justify-center">
      <q-btn color="primary" @click="handleGoSignup" class="q-mr-md">
        <q-icon left size="2rem" name="person_add_alt" />
        <div>Sign Up</div>
      </q-btn>
      <q-btn flat color="primary" class="q-ml-md q-mr-none" @click="handleGoLogin">
        <q-icon left size="2rem" name="login" />
        <div>Log in</div>
      </q-btn>
    </q-bar>
  </q-page>
</template>

<script>
import VeneuLogo from "../components/VeneuLogo";
export default {
  name: "Landing",
  components: {
    VeneuLogo,
  },
  methods: {
    handleGoLogin() {
      this.$router.push({ name: "Login" });
    },
    handleGoSignup() {
      this.$router.push({ name: "Signup" });
    },
  },
};
</script>

<style scoped>
.spinner {
  width: 14rem;
  margin: auto;
}
h1 {
  font-size: 6rem !important;
  line-height: 5rem !important;
  margin-top: 0;
  margin-bottom: 2rem;
}
</style>

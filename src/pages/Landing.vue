<template>
  <q-page id="landing-page">
    <div class="vertical-center spinner-stage">
      <VeneuLogo class="spinner" />
      <!-- <img alt="Veneu Logo" src="../assets/veneu-logo.svg" /> -->
      <div>
        <h1>veneu</h1>
      </div>
      <q-bar id="landing-actions" class="q-gutter-md q-pa-sm q-ma-sm q-mt-lg justify-center">
        <q-btn color="primary" @click="handleGoSignup">
          <q-icon left size="2rem" name="person_add_alt" />
          <div>Sign Up</div>
        </q-btn>
        <q-btn flat color="primary" class="q-ml-md" @click="handleGoLogin">
          <q-icon left size="2rem" name="login" />
          <div>Log in</div>
        </q-btn>
      </q-bar>
    </div>
  </q-page>
</template>

<script>
import VeneuLogo from "../components/VeneuLogo";
export default {
  name: "Landing",
  components: {
    VeneuLogo
  },
  methods: {
    handleGoLogin() {
      this.$router.push({ name: "Login" });
    },
    handleGoSignup() {
      this.$router.push({ name: "Signup" });
    }
  }
};
</script>

<style scoped>
#landing-page {
  text-align: center;
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: auto;
}
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

<template>
  <q-page id="notfound-page">
    <div class="vertical-center">
      <VeneuLogo />
      <div class="col">
        <h1>veneu</h1>
        <h2>404 - Content not found</h2>
      </div>
    </div>
  </q-page>
</template>

<script>
import VeneuLogo from "../components/VeneuLogo";
export default {
  name: "NotFound",
  components: {
    VeneuLogo,
  },
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
h2 {
  text-align: center;
}
</style>

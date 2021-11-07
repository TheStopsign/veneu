<template>
  <q-responsive :ratio="1" style="max-width: 20rem; margin: auto">
    <img
      :src="
        theme == 'light' || theme == 'true' ? '/veneu-offset-colorized.svg' : '/veneu-offset-colorized-dark-sticker.svg'
      "
      class="veneu-logo"
    />
  </q-responsive>
</template>

<script>
// import SVG from "./veneu-offset-colorized.svg";
export default {
  name: "VeneuLogo",
  data() {
    return {
      theme: localStorage.getItem("theme"),
    };
  },
  mounted() {
    let self = this;
    window.addEventListener("theme-change", function (event) {
      self.theme = event.detail.value;
      console.log(self.theme);
    });
  },
};
</script>

<style scoped>
/* .veneu-logo {
  height: auto;
} */
</style>

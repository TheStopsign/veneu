<template>
  <q-page class="q-pa-md">
    <div v-if="receiptQuery.error">Error fetching receipt data...</div>
    <div v-if="receiptQuery.data && receiptQuery.data.receipt" id="receiptloaded">
      <h1 class="row full-width justify-center q-mt-xl">Receipt</h1>
      <div class="row full-width justify-center">
        <q-responsive class="neu-convex q-mt-md" style="width: 50vh" :ratio="1">
          <vue-qr
            :text="receiptString()"
            :size="512"
            backgroundColor="#fff"
            colorLight="#fff"
            colorDark="#1a4974"
            :margin="48"
            style="height: 100%; width: 100%; border-radius: inherit"
            class="q-pa-xs"
          />
        </q-responsive>
      </div>
    </div>
    <div v-else></div>
  </q-page>
</template>

<script>
import VueQr from "vue-qr";
import gql from "graphql-tag";
import logoSrc from "../assets/logo.png";
export default {
  props: {
    me: Object,
  },
  components: { VueQr },
  data() {
    return {
      receiptQuery: {
        error: null,
        loading: null,
        data: null,
      },
    };
  },
  created() {
    this.getReceipt();
  },
  methods: {
    receiptString() {
      return JSON.stringify({
        code: this.receiptQuery.data.receipt.code,
        email: this.receiptQuery.data.receipt.email,
        checkin: this.receiptQuery.data.receipt.checkin._id,
      });
    },
    getReceipt() {
      let self = this;
      this.$apollo
        .query({
          query: gql`
            query receipt($_id: ID!, $email: String!) {
              receipt(_id: $_id, email: $email) {
                _id
                email
                code
                checkin {
                  _id
                }
              }
            }
          `,
          variables: { _id: this.$route.params._id, email: this.me.email },
        })
        .then((data) => {
          this.receiptQuery.loading = false;
          this.receiptQuery.data = data.data;
        })
        .catch((e) => {
          this.receiptQuery.error = e;
        });
    },
    handleReceipt() {
      this.$router.push({ name: "CheckinReceipt", params: { _id: this.$route.params._id } });
    },
    getBaseUrl() {
      var getUrl = window.location;
      return getUrl.protocol + "//" + getUrl.host;
    },
  },
};
</script>

<style scoped></style>

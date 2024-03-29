<template>
  <q-page class="q-pa-md">
    <q-dialog v-model="needsEmail" persistent transition-show="scale" transition-hide="scale">
      <q-card class="bg-teal text-primary" style="width: 300px">
        <q-card-section>
          <div class="text-h6">An email is required</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input type="text" standout="bg-primary text-white" color="primary" v-model="email" label="Email" />
        </q-card-section>

        <q-card-actions class="q-mb-md q-mx-sm">
          <q-btn label="Cancel" v-close-popup :to="{ path: '/' }" />
          <q-space />
          <q-btn label="OK" v-close-popup :disabled="!isValidEmail(email)" @click="needsEmail = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <div class="text-center" style="display: flex; flex-direction: column; height: 100%">
      <div class="row full-width" style="justify-content: center">
        <q-btn
          v-if="$q.platform.is.desktop && false === screen_scanning"
          @click="handleStartScreenScan()"
          icon="monitor"
          icon-right="qr_code_scanner"
          size="lg"
          label="Select a region"
        />
        <q-btn
          v-else-if="true === screen_scanning"
          @click="handleStopScreenScan()"
          icon-right="stop"
          size="lg"
          label="Stop"
          color="red"
        />
      </div>
      <div v-if="true === screen_scanning" style="text-align: left" class="q-my-md">
        <q-icon size="xl" :name="!last ? 'search' : 'qr_code'" style="display: inline-block" class="q-mr-sm" />
        <div style="display: inline-block">
          {{ !last ? "Searching for QR Code..." : "QR Code found! Keep scanning..." }}
        </div>
      </div>
      <q-responsive
        :ratio="video_el && video_el.scrObject ? video_el.scrObject.width / video_el.scrObject.height : 16 / 9"
        style="max-height: 50vh"
      >
        <video id="captured-screen" autoplay :style="screen_scanning ? '' : 'display: none'" class="neu-convex"></video>
      </q-responsive>
    </div>
    <ApolloSubscribeToMore
      v-if="user && screen_scanning"
      :document="
        (gql) =>
          gql`
            subscription approvedTicket($user: ID!) {
              approvedTicket(user: $user) {
                code
                user
                email
              }
            }
          `
      "
      :variables="{ user }"
      :updateQuery="onApproved"
    />
  </q-page>
</template>

<script>
import QrScanner from "qr-scanner";
QrScanner.WORKER_PATH = "../../qr-scanner-worker.min.js";
import gql from "graphql-tag";
export default {
  props: {
    me: Object,
  },
  data() {
    return {
      screen_scanning: false,
      screen_stream: null,
      screen_scanner: null,
      last: "",
      user: null,
      needsEmail: true,
      email: "",
      video_el: null,
      engine: null,
      canvas: null,
      previous: [],
    };
  },
  created() {
    if (this.me) {
      this.needsEmail = false;
      this.email = this.me.email;
      this.user = this.me._id;
    } else {
      this.user = this.generateID();
    }

    var self = this;

    this.canvas = document.createElement("canvas");
  },
  mounted() {
    this.video_el = document.getElementById("captured-screen");
  },
  beforeDestroy() {
    this.handleStopScreenScan();
  },
  methods: {
    isValidEmail(val) {
      const emailPattern =
        /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/;
      if (emailPattern.test(val)) {
        return true;
      } else {
        return false;
      }
    },
    generateID() {
      var result = "";
      var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var charactersLength = characters.length;
      for (var i = 0; i < 24; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    },
    async handleDecodeQR(result) {
      try {
        let url = new URL(result);
        let code = url.searchParams.get("code");
        let checkin = url.searchParams.get("checkin");
        if (code && code.length == 24) {
          if (this.previous[this.previous.length - 1] != code) {
            this.previous.push({
              code,
              email: this.email,
              user: this.user,
              checkin,
            });
            if (this.previous.length > 5) {
              this.previous.splice(0, 1);
              await this.sendReservation(checkin, this.previous);
            }
            await this.sendClaim(code, checkin);
          }

          this.last = code;
          return code;
        } else {
          this.last = "";
          return null;
        }
      } catch (error) {
        this.last = "";
        return null;
      }
    },
    async handleDecodeError() {
      this.last = "";
    },
    async createIntervalScanner() {
      this.screen_scanning = true;
      this.video_el.srcObject = this.screen_stream;
      setTimeout(this.cycle, 500);
    },
    async cycle() {
      let self = this;
      if (self.screen_scanning) {
        await QrScanner.scanImage(self.video_el, undefined, self.engine, self.canvas)
          .then((result) => self.handleDecodeQR(result))
          .catch((error) => self.handleDecodeError());
        self.cycle();
      }
    },
    async handleStartScreenScan() {
      this.screen_scanning = null;
      let self = this;
      if (navigator && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: false, frameRate: 24 })
          .then((res) => {
            if (res) {
              self.screen_stream = res;
              self.canvas.height = res.getVideoTracks()[0].getSettings().height;
              self.canvas.width = res.getVideoTracks()[0].getSettings().width;
              QrScanner.createQrEngine(QrScanner.WORKER_PATH)
                .then((engine) => {
                  self.engine = engine;
                  self.createIntervalScanner();
                })
                .catch((err) => {
                  self.handleStopScreenScan();
                });
            } else {
              self.handleStopScreenScan();
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    },
    async handleStopScreenScan() {
      this.screen_scanning = false;
      if (this.screen_scanner) {
        clearInterval(this.screen_scanner);
        this.screen_scanner = null;
      }
      if (this.screen_stream) {
        this.screen_stream.getTracks().forEach((track) => track.stop());
        this.screen_stream = null;
      }
      this.video_el.srcObject = null;
      if (this.engine) {
        this.engine.terminate();
        this.engine = null;
      }
      this.last = "";
      this.previous = [];
    },
    async sendClaim(code, checkin) {
      this.$apollo.mutate({
        mutation: gql`
          mutation claimTicket($code: String!, $user: ID!, $email: String!, $checkin: ID!) {
            claimTicket(code: $code, user: $user, email: $email, checkin: $checkin) {
              code
              user
              email
            }
          }
        `,
        variables: {
          code,
          user: this.user,
          email: this.email,
          checkin,
        },
      });
    },
    async sendReservation(checkin, tickets) {
      this.$apollo.mutate({
        mutation: gql`
          mutation reserveTicket($checkin: ID!, $tickets: [TicketInput]!) {
            reserveTicket(checkin: $checkin, tickets: $tickets) {
              code
              user
              email
            }
          }
        `,
        variables: {
          checkin,
          tickets,
        },
      });
    },
    onApproved(
      previousResult,
      {
        subscriptionData: {
          data: { approvedTicket },
        },
      }
    ) {
      window.focus();
      this.$q.notify({
        progress: true,
        message: "Your attendance has been recorded",
        icon: "event_seat",
        color: "primary",
      });
      if (this.screen_scanning) {
        this.handleStopScreenScan();
      }
      setTimeout(function () {
        window.close();
      }, 5000);
    },
  },
};
</script>

<style scoped>
.justify-center {
  position: absolute;
  height: 100%;
}

.scanning.found-qr {
  background: var(--veneu-green) !important;
}
.scanning.no-qr {
  background: var(--veneu-red) !important;
}
.q-responsive__content > * {
  width: unset !important;
}
</style>

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
          v-if="$q.platform.is.desktop && !camera_scanning"
          class="q-mx-md q-mt-md"
          @click="handleStartScreenScan()"
          icon="monitor"
          icon-right="qr_code_scanner"
          size="xl"
          label="Screen Scan"
        />
        <q-btn
          v-if="has_camera && !camera_scanning"
          class="q-mx-md q-mt-md"
          @click="handleStartCamScan()"
          icon="photo_camera"
          icon-right="qr_code_scanner"
          size="xl"
          label="Camera Scan"
        />
        <q-btn
          v-else-if="camera_scanning"
          @click="handleStopCamScan()"
          icon-right="stop"
          size="xl"
          label="Stop"
          color="red"
        />
      </div>
      <div v-if="camera_scanning" style="text-align: left" class="q-my-md">
        <q-icon size="xl" :name="!last ? 'search' : 'qr_code'" style="display: inline-block" class="q-mr-sm" />
        <div style="display: inline-block">
          {{ !last ? "Searching for QR Code..." : "QR Code found! Keep scanning..." }}
        </div>
      </div>
      <q-responsive v-if="$q.screen.lt.sm" style="height: 50vh; max-width: 100%">
        <video id="captured-camera" autoplay :style="camera_scanning ? '' : 'display: none'"></video>
      </q-responsive>
      <q-responsive v-else :ratio="16 / 9" style="max-height: 50vh">
        <video id="captured-camera" autoplay :style="camera_scanning ? '' : 'display: none'"></video>
      </q-responsive>
    </div>
    <ApolloSubscribeToMore
      v-if="user && camera_scanning"
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
console.log(QrScanner);
import gql from "graphql-tag";
export default {
  props: {
    me: Object,
  },
  data() {
    return {
      last: "",
      has_camera: false,
      camera_scanning: false,
      camera_stream: null,
      camera_scanner: null,
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

    QrScanner.hasCamera().then((res) => {
      self.has_camera = true;
    });

    this.canvas = document.createElement("canvas");
  },
  mounted() {
    this.video_el = document.getElementById("captured-camera");
  },
  beforeDestroy() {
    this.handleStopCamScan();
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
        let host = url.searchParams.get("host");
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
              this.sendReservation(host, this.previous);
            }
            this.sendClaim(code, checkin);
          }

          this.last = code;
        } else {
          this.last = "";
        }
      } catch (error) {
        this.last = "";
      }
    },
    async handleDecodeError() {
      this.last = "";
    },
    async handleStartCamScan() {
      this.camera_scanning = false;
      let self = this;
      if (navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.video_el.setAttribute("autoplay", "");
        this.video_el.setAttribute("muted", "");
        this.video_el.setAttribute("playsinline", "");
        navigator.mediaDevices
          .getUserMedia({
            audio: false,
            video: {
              facingMode: "environment",
            },
          })
          .then((res) => {
            if (res) {
              self.camera_stream = res;
              QrScanner.createQrEngine(QrScanner.WORKER_PATH)
                .then((engine) => {
                  self.engine = engine;
                  self.createIntervalScanner();
                })
                .catch((err) => {
                  self.handleStopCamScan();
                });
            } else {
              self.handleStopCamScan();
            }
          })
          .catch((err) => {
            self.handleStopCamScan();
          });
      }
    },
    async handleStopCamScan() {
      this.camera_scanning = false;
      if (this.camera_scanner) {
        clearInterval(this.camera_scanner);
        this.camera_scanner = null;
      }
      if (this.camera_stream) {
        this.camera_stream.getTracks().forEach((track) => track.stop());
        this.camera_stream = null;
      }
      this.video_el.srcObject = null;
      if (this.engine) {
        this.engine.terminate();
        this.engine = null;
      }
      this.last = "";
      this.previous = [];
    },
    async createIntervalScanner() {
      this.camera_scanning = true;
      this.video_el.srcObject = this.camera_stream;
      this.camera_scanner = setInterval(() => {
        if (this.camera_stream) {
          QrScanner.scanImage(this.video_el, undefined, this.engine, this.canvas)
            .then((result) => this.handleDecodeQR(result))
            .catch((error) => this.handleDecodeError());
        } else {
          this.handleStopCamScan();
        }
      }, 200);
    },
    async handleStartScreenScan() {
      window.open("/checkin/scan/desktop", "_blank", "location=yes,height=480,width=640,scrollbars=yes,status=yes");
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
    async sendReservation(host, tickets) {
      this.$apollo.mutate({
        mutation: gql`
          mutation reserveTicket($host: ID!, $tickets: [TicketInput!]!) {
            reserveTicket(host: $host, tickets: $tickets) {
              code
              user
              email
            }
          }
        `,
        variables: {
          host,
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
      this.$q.notify({
        progress: true,
        message: "Your attendance has been recorded",
        icon: "event_seat",
        color: "primary",
      });
      window.focus();
      if (this.camera_scanning) {
        this.handleStopCamScan();
      }
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
</style>

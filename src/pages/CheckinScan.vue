<template>
  <q-page class="q-pa-md">
    <q-dialog v-model="needsName" persistent transition-show="scale" transition-hide="scale">
      <q-card class="bg-teal text-primary" style="width: 300px">
        <q-card-section>
          <div class="text-h6">A name is required</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input type="text" standout="bg-primary text-white" color="primary" v-model="first_name" label="First" />
          <q-input
            type="text"
            standout="bg-primary text-white"
            color="primary"
            v-model="last_name"
            label="Last"
            class="q-pt-md"
          />
        </q-card-section>

        <q-card-actions class="q-mb-md q-mx-sm">
          <q-btn label="Cancel" v-close-popup :to="{ path: '/' }" />
          <q-space />
          <q-btn label="OK" v-close-popup :disabled="!first_name || !last_name" @click="needsName = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <div class="text-center" style="display: flex; flex-direction: column; height: 100%;">
      <q-btn
        v-if="$q.platform.is.desktop && false === screen_scanning && !camera_scanning"
        @click="handleStartScreenScan()"
        icon="monitor"
        icon-right="qr_code_scanner"
        size="xl"
        label="Screen Scan"
        class="row"
      />
      <q-btn
        v-else-if="true === screen_scanning"
        @click="handleStopScreenScan()"
        icon-right="stop"
        size="xl"
        label="Stop"
        class="row"
      />
      <q-btn
        v-if="has_camera && false === screen_scanning && !camera_scanning"
        class="q-mt-md row"
        @click="handleStartCamScan()"
        icon="photo_camera"
        icon-right="qr_code_scanner"
        size="xl"
        label="Camera Scan"
      />
      <q-btn
        v-else-if="camera_scanning"
        class="q-mt-md row"
        @click="handleStopCamScan()"
        icon-right="stop"
        size="xl"
        label="Stop"
      />
      <q-icon
        v-if="true === screen_scanning || camera_scanning"
        size="xl"
        :name="!last ? 'search' : 'qr_code'"
        style="display: flex; flex-direction: row;"
      />
      <q-responsive :ratio="16 / 9" style="max-height: 50vh;">
        <video id="captured-screen" autoplay :style="{ display: 'none' }"></video>
        <video
          v-if="camera_scanning"
          id="camera-video"
          autoplay
          style="display: flex; flex-direction: row;"
          class="q-pa-md neu-convex"
        ></video>
      </q-responsive>
    </div>
    <ApolloSubscribeToMore
      v-if="user"
      :document="
        gql =>
          gql`
            subscription approvedTicket($user: ID!) {
              approvedTicket(user: $user) {
                code
                user
                first_name
                last_name
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
    me: Object
  },
  data() {
    return {
      screen_scanning: false,
      screen_stream: null,
      screen_scanner: null,
      last: "",
      has_camera: false,
      camera_scanning: false,
      camera_scanner: null,
      user: null,
      needsName: true,
      first_name: "",
      last_name: "",
      video_el: null,
      engine: null,
      canvas: null,
      previous: []
    };
  },
  created() {
    if (this.me) {
      this.needsName = false;
      this.first_name = this.me.first_name;
      this.last_name = this.me.last_name;
      this.user = this.me._id;
    } else {
      this.user = this.generateID();
    }

    var self = this;

    QrScanner.hasCamera().then(res => {
      self.has_camera = true;
    });

    this.canvas = document.createElement("canvas");
  },
  mounted() {
    this.video_el = document.getElementById("captured-screen");
  },
  beforeDestroy() {
    this.handleStopScreenScan();
    this.handleStopCamScan();
  },
  methods: {
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
              first_name: this.first_name,
              last_name: this.last_name,
              user: this.user,
              checkin
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
      this.camera_scanning = true;
      let self = this;
      this.$nextTick(() => {
        var video = document.getElementById("camera-video");
        self.camera_scanner = new QrScanner(
          video,
          result => this.handleDecodeQR(result),
          error => this.handleDecodeError()
        );
        self.camera_scanner.start();
      });
    },
    async handleStopCamScan() {
      this.camera_scanning = false;
      if (this.camera_scanner) {
        this.camera_scanner.stop();
        this.camera_scanner.destroy();
        this.camera_scanner = null;
      }
      this.last = "";
      this.previous = [];
    },
    async createIntervalScanner() {
      this.screen_scanning = true;
      this.video_el.srcObject = this.screen_stream;
      this.screen_scanner = setInterval(() => {
        if (this.screen_stream) {
          QrScanner.scanImage(this.video_el, undefined, this.engine, this.canvas)
            .then(result => this.handleDecodeQR(result))
            .catch(error => this.handleDecodeError());
        } else {
          this.handleStopScreenScan();
        }
      }, 200);
    },
    async handleStartScreenScan() {
      this.screen_scanning = null;
      let self = this;
      if (navigator && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: false, frameRate: 24 })
          .then(res => {
            if (res) {
              self.screen_stream = res;
              QrScanner.createQrEngine(QrScanner.WORKER_PATH)
                .then(engine => {
                  self.engine = engine;
                  self.createIntervalScanner();
                })
                .catch(err => {
                  self.handleStopScreenScan();
                });
            } else {
              self.handleStopScreenScan();
            }
          })
          .catch(err => {
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
        this.screen_stream.getTracks().forEach(track => track.stop());
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
          mutation claimTicket($code: String!, $user: ID!, $first_name: String!, $last_name: String!, $checkin: ID!) {
            claimTicket(code: $code, user: $user, first_name: $first_name, last_name: $last_name, checkin: $checkin) {
              code
              user
              first_name
              last_name
            }
          }
        `,
        variables: {
          code,
          user: this.user,
          first_name: this.first_name,
          last_name: this.last_name,
          checkin
        }
      });
    },
    async sendReservation(host, tickets) {
      this.$apollo.mutate({
        mutation: gql`
          mutation reserveTicket($host: ID!, $tickets: [TicketInput!]!) {
            reserveTicket(host: $host, tickets: $tickets) {
              code
              user
              first_name
              last_name
            }
          }
        `,
        variables: {
          host,
          tickets
        }
      });
    },
    onApproved(
      previousResult,
      {
        subscriptionData: {
          data: { approvedTicket }
        }
      }
    ) {
      this.$q.notify({
        progress: true,
        message: "Your attendance has been recorded",
        icon: "event_seat",
        color: "primary"
      });
      window.focus();
      if (this.screen_scanning) {
        this.handleStopScreenScan();
      } else if (this.camera_scanning) {
        this.handleStopCamScan();
      }
    }
  }
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

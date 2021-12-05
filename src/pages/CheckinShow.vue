<template>
  <q-page class="q-pa-md">
    <q-skeleton
      v-if="checkinQuery.loading"
      class="bg-primary q-pa-md"
      width="50vh"
      height="50vh"
      style="margin: auto"
    />
    <div v-if="receiptQuery.error">Error fetching receipt data...</div>
    <div v-if="receiptQuery.data" class="col">
      <div class="q-mt-xl row full-width justify-center">You are not allowed to host this checkin</div>
      <div v-if="receiptQuery.data.receipt" class="q-mt-xl col full-width">
        <div class="row full-width justify-center">However, you have a receipt available.</div>
        <div class="q-mt-md row full-width justify-center">
          <q-btn class="q-mx-auto" @click="handleReceipt">View Receipt</q-btn>
        </div>
      </div>
    </div>
    <div v-if="checkinQuery.error">Error fetching checkin data...</div>
    <div v-if="checkinQuery.data && checkinQuery.data.checkin" id="checkinloaded">
      <div class="row full-width justify-center">
        <q-responsive class="neu-convex q-mt-md" style="width: 50vh" :ratio="1">
          <vue-qr
            :key="current.code"
            :text="getBaseUrl() + '/checkin/scan?code=' + current.code + '&checkin=' + $route.params._id"
            :size="512"
            backgroundColor="#fff"
            colorLight="#fff"
            colorDark="#1a4974"
            :margin="24"
            style="height: 100%; width: 100%; border-radius: inherit"
            class="q-pa-xs"
          />
          <div
            class="absolute-full items-center justify-center row anim"
            :class="qr_hidden ? 'lockview' : ''"
            style="z-index: 2; border-radius: inherit"
          >
            <q-icon v-if="qr_hidden" name="visibility_off" size="4rem" style="cursor: unset" />
          </div>
        </q-responsive>
      </div>
      <div class="row full-width justify-center q-mt-xl">
        <ShareResourceModal :resourceid="$route.params._id" resourcetype="Checkin" :me="me" v-if="hasPermissions()" />
        <q-btn
          :label="qr_hidden ? 'Show QR' : 'Hide QR'"
          size="md"
          icon-right="qr_code_2"
          @click="qr_hidden = !qr_hidden"
          class="q-ml-md"
        />
      </div>
      <div class="row full-width justify-center q-mt-xl">
        <div v-if="$q.platform.is.mobile">
          <p>
            <q-icon size="sm" color="primary" name="event_seat" /> x{{ Object.keys(tickets).length - 1 }}
            <q-btn
              v-if="Object.keys(tickets).length - 1 > 0"
              icon="download"
              class="q-ml-sm"
              title="Download Attendance CSV"
              @click="downloadCSV"
            />
          </p>
        </div>
        <div v-else>
          <div class="row full-width justify-center q-mt-md">
            <p>
              {{ Object.keys(tickets).length - 1 }} seats claimed
              <q-btn
                v-if="Object.keys(tickets).length - 1 > 0"
                icon="download"
                class="q-ml-sm"
                title="Download Attendance CSV"
                @click="downloadCSV"
              />
            </p>
          </div>
          <div id="seatsiconscroll" class="row full-width justify-center q-mt-md">
            <div
              class="seatindicator q-pa-xs"
              v-for="ticket in tickets"
              :key="ticket.code"
              :title="ticket.email"
              :style="{ display: ticket && ticket.code == current.code ? 'none' : 'inline-block' }"
            >
              <div v-if="ticket.code != current.code">
                <q-icon size="lg" color="primary" name="event_seat" />
                <p>
                  {{ ticket.email }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row full-width justify-center q-mt-lg">
        <div class="dangerzone">
          <q-btn label="Delete" size="md" icon-right="delete" class="bg-red text-white" @click="deleteModal = true" />
        </div>
      </div>
      <ApolloSubscribeToMore
        :document="
          (gql) =>
            gql`
              subscription claimedTicket($code: String!) {
                claimedTicket(code: $code) {
                  code
                  user
                  email
                }
              }
            `
        "
        :variables="{ code: current.code }"
        :updateQuery="onClaimed"
      />
      <ApolloSubscribeToMore
        :document="
          (gql) =>
            gql`
              subscription reservedTicket($checkin: ID!) {
                reservedTicket(checkin: $checkin) {
                  code
                  user
                  email
                }
              }
            `
        "
        :variables="{ checkin: $route.params._id }"
        :updateQuery="onReserved"
      />
      <q-dialog v-model="deleteModal" persistent>
        <q-card class="q-pa-sm">
          <q-card-section class="row items-center">
            <q-avatar icon="delete" color="red" text-color="white" />
            <span class="q-ml-sm">Are you sure? This is <b>permanent</b>.</span>
          </q-card-section>

          <q-card-actions>
            <q-btn label="Cancel" class="text-primary" v-close-popup />
            <q-space />
            <q-btn label="Delete" color="white" class="bg-red" v-close-popup @click="handleDelete" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script>
import VueQr from "vue-qr";
import gql from "graphql-tag";
import logoSrc from "../assets/logo.png";
import ShareResourceModal from "../components/ShareResourceModal.vue";
export default {
  props: {
    me: Object,
  },
  components: { VueQr, ShareResourceModal },
  data() {
    return {
      qr_hidden: true,
      tickets: null,
      current: null,
      next: null,
      deleteModal: false,
      checkinQuery: {
        error: null,
        loading: null,
        data: null,
      },
      receiptQuery: {
        error: null,
        loading: null,
        data: null,
      },
    };
  },
  created() {
    let self = this;
    let currAuth = this.me.auths.find(
      (a) => a.shared_resource._id == self.$route.params._id && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
    );
    if (currAuth) {
      this.startNewSession();
    } else {
      this.getReceipt();
    }
  },
  methods: {
    hasPermissions() {
      return (
        this.me &&
        this.me.auths.find(
          (a) =>
            a.shared_resource._id == this.$route.params._id && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
        )
      );
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
    startNewSession() {
      this.tickets = {};
      this.current = this.generateTicket();
      this.next = this.generateTicket();
      this.deleteModal = false;
      this.checkinQuery = {
        error: null,
        loading: true,
        data: null,
      };
      this.$apollo
        .query({
          query: gql`
            query checkin($_id: ID!) {
              checkin(_id: $_id) {
                _id
                tickets {
                  email
                  user
                  code
                }
                creator {
                  name
                }
                created_at
              }
            }
          `,
          variables: { _id: this.$route.params._id },
        })
        .then((data) => {
          this.checkinQuery.loading = false;
          this.checkinQuery.data = data.data;
          this.checkinQuery.data.checkin.tickets.forEach((ticket) => {
            this.tickets[ticket.code] = ticket;
          });
          this.tickets[this.current.code] = { ...this.current };
        })
        .catch((e) => {
          this.checkinQuery.error = e;
        });
    },
    downloadCSV() {
      const csvContent =
        "data:text/csv;charset=utf-8,Email,Code\n" +
        Object.values(this.tickets)
          .map((e) => e.user && [e.email, e.code].join(","))
          .join("\n");

      const encodedUri = encodeURI(csvContent);
      var link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "attendance-" + this.$route.params._id + ".csv");
      document.body.appendChild(link);

      link.click();
    },
    getBaseUrl() {
      var getUrl = window.location;
      return getUrl.protocol + "//" + getUrl.host;
    },
    onClaimed(
      previousResult,
      {
        subscriptionData: {
          data: { claimedTicket },
        },
      }
    ) {
      if (
        !Object.values(this.tickets)
          .map((a) => a.user)
          .includes(claimedTicket.user)
      ) {
        this.current = this.next; // iteration logic
        this.next = this.generateTicket();
        this.tickets[this.current.code] = { ...this.current };
        this.tickets[claimedTicket.code] = { ...this.tickets[claimedTicket.code], ...claimedTicket };
        this.sendApprove(this.tickets[claimedTicket.code]);
        this.$q.notify({
          progress: true,
          message: claimedTicket.email + " checked in",
          icon: "event_seat",
          color: "primary",
        });
      }
    },
    onReserved(
      previousResult,
      {
        subscriptionData: {
          data: { reservedTicket },
        },
      }
    ) {
      const reservation_time = Date.now();
      if (
        reservedTicket.length == 5 &&
        Object.keys(this.tickets).length >= 5 &&
        reservedTicket.every(
          (ticket) =>
            undefined != this.tickets[ticket.code] && reservation_time - this.tickets[ticket.code].creation_time <= 5000
        ) &&
        !Object.values(this.tickets)
          .map((a) => a.user)
          .includes(reservedTicket[0].user)
      ) {
        var reservedticket = {
          ...this.generateTicket(),
          user: reservedTicket[0].user,
          email: reservedTicket[0].email,
        };
        this.tickets[reservedticket.code] = reservedTicket;
        this.sendApprove(reservedticket);
        this.$q.notify({
          progress: true,
          message: reservedticket.email + " reserved their seat",
          icon: "event_seat",
          color: "primary",
        });
      }
    },
    generateTicket() {
      var result = "";
      var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var charactersLength = characters.length;
      for (var i = 0; i < 24; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return {
        code: result,
        creation_time: Date.now(),
        checkin: this.$route.params._id,
      };
    },
    async sendApprove(ticket) {
      this.$apollo.mutate({
        mutation: gql`
          mutation approveTicket($code: String!, $user: ID!, $email: String!, $checkin: ID!) {
            approveTicket(code: $code, user: $user, email: $email, checkin: $checkin) {
              code
              user
              email
            }
          }
        `,
        variables: ticket,
      });
    },
    async handleDelete() {
      this.$apollo
        .mutate({
          mutation: gql`
            mutation deleteCheckin($_id: ID!) {
              deleteCheckin(_id: $_id) {
                _id
              }
            }
          `,
          variables: {
            _id: this.$route.params._id,
          },
        })
        .then(({ data }) => {
          location.href = "/calendar";
        })
        .catch((e) => {
          this.$q.notify({
            progress: true,
            message: "We encountered an issue when deleting this checkin",
            icon: "error",
            color: "negative",
          });
        });
    },
  },
};
</script>

<style scoped>
.seatindicator {
  text-align: center;
}
#seatsiconscroll {
  overflow-y: auto;
  max-height: 20rem;
}
.q-icon {
  width: unset;
}
</style>

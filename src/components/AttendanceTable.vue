<template>
  <div class="q-my-md rounded-borders">
    <q-table
      title="Attendance - coming soon"
      flat
      v-if="calculated"
      :data="rows"
      :columns="columns"
      row-key="email"
      style="border-radius: inherit"
    >
      <template v-slot:body="props">
        <q-tr :props="props" :title="getPercentText(Math.max(props.row.checkin, props.row.recording))">
          <q-td key="name" :props="props">
            {{ props.row.name }}
          </q-td>
          <q-td key="email" :props="props">
            {{ props.row.email }}
          </q-td>
          <q-td key="checkin" :props="props"> {{ getPercentText(props.row.checkin) }}</q-td>
          <q-td key="recording" :props="props"> {{ getPercentText(props.row.recording) }} </q-td>
          <q-td key="attendance" :props="props">
            {{ getPercentText(props.row.checkin, props.row.recording) }}
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
export default {
  name: "AttendanceTable",
  props: {
    recording: {
      type: Object,
    },
    checkins: {
      type: Array,
    },
    for: {
      type: Array,
    },
  },
  data() {
    return {
      rows: [],
      columns: [
        {
          name: "name",
          label: "Name",
          align: "left",
          sortable: true,
        },
        { name: "email", align: "center", label: "Email", sortable: true },
        {
          name: "checkin",
          align: "center",
          label: "Checkins",
          sortable: true,
        },
        {
          name: "recording",
          label: "Recordings",
          sortable: true,
        },
        {
          name: "attendance",
          label: "Overall",
          sortable: true,
        },
      ],
      calculated: false,
    };
  },
  created() {
    this.calculateAttendance();
  },
  methods: {
    getPercentText(val, val2) {
      if (val == "N/A") {
        return val;
      } else if (typeof val2 == "undefined") {
        return val * 100 + "%";
      } else {
        return Math.max(val, val2) * 100 + "%";
      }
    },
    calculateAttendance() {
      var i = 0,
        len = this.for.length;
      for (; i < len; i++) {
        let obj = {
          name: this.for[i].user.name,
          email: this.for[i].user.email,
          checkin: 0,
          recording: 0,
        };

        let studcheckins = this.checkins.find((a) => a.tickets.includes((b) => b.user == this.for[i].user._id));
        obj.checkin = studcheckins ? studcheckins.length / this.checkins.length : obj.checkin;

        if (this.recording && this.recording.assignment && this.assignment.submissions) {
          let studsubmission = this.assignment.submissions.find(
            (a) => a.submittable.creator._id == this.for[i].user._id
          );
          obj.recording = studsubmission
            ? studsubmission.submittable.seconds_watched / this.recording.duration
            : obj.recording;
        }
        this.rows = [...this.rows, obj];
      }

      let forIDs = this.for.map((a) => a.user._id);
      (i = 0), (len = this.checkins.length);
      for (; i < len; i++) {
        let j = 0,
          jlen = this.checkins[i].tickets.length;
        for (; j < jlen; j++) {
          let nonStudentID = this.checkins[i].tickets[j].user;
          if (!forIDs.includes(nonStudentID)) {
            let obj = {
              name: "Guest",
              email: this.checkins[i].tickets[j].email,
              checkin: "N/A",
              recording: "N/A",
            };
            this.rows = [...this.rows, obj];
          }
        }
      }
      this.calculated = true;
    },
  },
};
</script>

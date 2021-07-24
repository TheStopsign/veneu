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
        <q-tr :props="props" :title="Math.max(props.row.checkin, props.row.recording) * 100 + '%'">
          <q-td key="name" :props="props">
            {{ props.row.name }}
          </q-td>
          <q-td key="email" :props="props">
            {{ props.row.email }}
          </q-td>
          <q-td key="checkin" :props="props"> {{ props.row.checkin * 100 }}% </q-td>
          <q-td key="recording" :props="props"> {{ props.row.recording * 100 }}% </q-td>
          <q-td key="attendance" :props="props"> {{ Math.max(props.row.checkin, props.row.recording) * 100 }}% </q-td>
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
    calculateAttendance() {
      var i = 0,
        len = this.for.length;
      for (; i < len; i++) {
        this.rows = [
          ...this.rows,
          {
            name: this.for[i].user.name,
            email: this.for[i].user.email,
            checkin: 0,
            recording: 0,
          },
        ];
      }
      this.calculated = true;
    },
  },
};
</script>

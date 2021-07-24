<template>
  <div class="q-my-md neu-convex rounded-borders">
    <q-table
      title="Attendance - coming soon"
      flat
      v-if="rows.length && columns.length"
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
  data() {
    return {
      rows: [
        {
          name: "Testname",
          email: "testname@gmail.com",
          checkin: 1,
          recording: 0,
        },
        {
          name: "Testname2",
          email: "testname2@gmail.com",
          checkin: 0.5,
          recording: 1,
        },
        {
          name: "Testname3",
          email: "testname3@gmail.com",
          checkin: 0.5,
          recording: 0.6,
        },
        {
          name: "Testname4",
          email: "testname4@gmail.com",
          checkin: 0.5,
          recording: 0.1,
        },
        {
          name: "Testname5",
          email: "testname5@gmail.com",
          checkin: 0.5,
          recording: 1,
        },
        {
          name: "Testname6",
          email: "testname6@gmail.com",
          checkin: 1,
          recording: 0,
        },
      ],
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
    };
  },
};
</script>

<template>
  <div class="share-resource-modal-container flex inline">
    <q-btn size="md" label="Share" title="Share" color="primary" @click="isOpen = true" class="q-mt-md" icon="share" />
    <q-dialog v-model="isOpen" noBackdropDismiss persistent>
      <ApolloQuery :query="require('../graphql/AuthsForResource.gql')" :variables="{ shared_resource: resourceid }">
        <template slot-scope="{ result: { loading, error, data } }">
          <div v-if="loading">Loading...</div>
          <div v-if="error">Error...</div>
          <div v-if="data && data.auths">
            <q-card>
              <q-card-section class="row">
                <div class="text-h6 text-primary">Share {{ resourcetype }}</div>
              </q-card-section>

              <q-card-section class="scroll row q-ma-none q-pr-md q-pl-none q-py-none">
                <q-input
                  standout="bg-primary text-white"
                  class="text-primary inline q-pl-md q-pb-md col-12"
                  v-model="emailInput"
                  color="primary"
                  label="Email"
                  placeholder="abc@xyz.com"
                />
                <q-select
                  standout="bg-primary text-white"
                  class="text-primary inline q-pl-md q-pb-md col-12 col-sm"
                  color="primary"
                  v-model="roleSelection"
                  :options="roleOptions"
                  label="Role"
                />
                <ApolloMutation
                  :mutation="
                    gql => gql`
                      mutation(
                        $emailInput: String!
                        $roleSelection: Role!
                        $resourceId: ID!
                        $sharedResourceType: String!
                      ) {
                        createAuth(
                          user: $emailInput
                          role: $roleSelection
                          shared_resource: $resourceId
                          shared_resource_type: $sharedResourceType
                        ) {
                          _id
                        }
                      }
                    `
                  "
                  :variables="{
                    emailInput,
                    roleSelection,
                    resourceId: resourceid,
                    sharedResourceType
                  }"
                >
                  <template v-slot="{ mutate, loading }">
                    <q-btn
                      v-close-popup
                      color="primary"
                      class="q-ml-md q-my-sm"
                      @click="mutate()"
                      label="Share"
                      icon-right="send"
                      size="md"
                      :loading="loading"
                      :disabled="isDisabled()"
                    >
                      <template v-slot:loading>
                        <q-spinner-dots />
                      </template>
                    </q-btn>
                  </template>
                </ApolloMutation>
              </q-card-section>

              <q-card-section class="scroll row q-ma-none q-px-none q-py-none">
                <q-table
                  flat
                  :data="data.auths"
                  :columns="columns"
                  row-key="name"
                  class="full-width q-px-md text-primary"
                />
              </q-card-section>

              <q-card-section class="row text-primary q-pt-none">
                <q-btn label="Back" icon="undo" size="md" v-close-popup @click="clearForm" />
                <q-space />
              </q-card-section>
            </q-card>
          </div>
        </template>
      </ApolloQuery>
    </q-dialog>
  </div>
</template>

<script>
export default {
  props: {
    resourceid: String,
    resourcetype: String,
    me: Object
  },
  data() {
    return {
      isOpen: false,
      submitShareCourse: false,
      emailInput: "",
      roleSelection: "None",
      roleOptions: ["None", "INSTRUCTOR", "TEACHING_ASSISTANT", "STUDENT"],
      sharedResourceType: "Course",
      columns: [
        {
          name: "name",
          label: "Name",
          align: "left",
          field: row => row.user.name,
          sortable: true
        },
        { name: "role", label: "Role", field: "role", sortable: true, align: "center" },
        { name: "email", label: "Email", field: row => row.user.email, sortable: true }
      ],
      tabledata: []
    };
  },
  methods: {
    isValidEmail(val) {
      const emailPattern = /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/;
      if (emailPattern.test(val)) {
        return true;
      } else {
        return false;
      }
    },
    isRoleSelected(val) {
      return val != "None";
    },
    isDisabled() {
      return !this.isValidEmail(this.emailInput) || !this.isRoleSelected(this.roleSelection);
    },
    clearForm() {
      this.emailInput = "";
      this.roleSelection = "None";
    }
  }
};
</script>

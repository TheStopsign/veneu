<template>
  <div class="q-my-md q-pa-md neu-concave" :class="nav ? 'neu-convex' : ''">
    {{ label || "Select a resource" }}
    <q-tree
      class="col-12 text-primary"
      default-expand-all
      :nodes="simple"
      node-key="_id"
      :selected.sync="selected_resource"
      :expanded.sync="expanded"
    />
  </div>
</template>

<script>
export default {
  props: {
    me: {
      type: Object,
      required: true,
    },
    selectable: {
      type: Array,
      required: false,
    },
    selected: {
      type: String,
      required: false,
    },
    label: {
      type: String,
      required: false,
    },
    nav: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      simple: [],
      selected_resource: null,
      ticked: [],
      expanded: [],
      error: "",
    };
  },
  watch: {
    $route: function (val, oldVal) {
      let selected_auth = this.me.auths.find((a) => a.shared_resource._id == val.params._id);
      if (selected_auth) {
        this.selected_resource = selected_auth.shared_resource._id;
      } else {
        this.selected_resource = null;
      }
    },
    selected_resource: function (val, oldVal) {
      let selected_auth = this.me.auths.find((a) => a.shared_resource._id == val);
      let old_auth = this.me.auths.find((a) => a.shared_resource._id == oldVal);
      let route_auth = this.me.auths.find((a) => a.shared_resource._id == this.$route.params._id);
      if (this.nav) {
        if (val && !old_auth && !route_auth) {
          this.$router.push({
            name: selected_auth.shared_resource_type,
            params: { _id: selected_auth.shared_resource._id },
          });
          return;
        }
        if (!val) {
          if (route_auth) {
            this.selected_resource = oldVal;
            return;
          }
          if (!selected_auth && old_auth && route_auth) {
            this.selected_resource = oldVal;
            return;
          }
          if (route_auth) {
            this.selected_resource = oldVal;
            return;
          } else {
            return;
          }
        }
        if ((selected_auth && this.selectable.includes(selected_auth._id) && oldVal != null) || old_auth != null) {
          this.$router.push({
            name: selected_auth.shared_resource_type,
            params: { _id: selected_auth.shared_resource._id },
          });
          return;
        }
      } else {
        if (val === oldVal) {
          return;
        } else if (!val) {
          this.$emit("change", val);
        } else {
          if (this.selectable && !this.selectable.includes(selected_auth._id)) {
            this.selected_resource = oldVal;
            this.errorMsg('Resource is not marked as "selectable"');
          } else {
            this.$emit("change", val);
          }
        }
      }
    },
    ticked: function (val, oldVal) {
      this.$emit("change", val);
    },
  },
  created() {
    this.buildTree();
    this.selected_resource = this.selected
      ? this.selected
      : this.nav && this.$route.params._id
      ? this.$route.params._id
      : null;
    console.log(this.selectable, this.selected_resource);
  },
  methods: {
    errorMsg(error) {
      this.$q.notify({
        progress: true,
        message: error,
        icon: "error",
        color: "negative",
      });
    },
    addAuthToTree(node, auth, depth) {
      if (!auth.shared_resource.parent_resource && !depth) {
        node.push({
          label: auth.shared_resource.name,
          ...auth.shared_resource,
          icon: auth.shared_resource_type == "Course" ? "school" : "school",
        });
        return;
      }
      for (let i = 0; i < node.length; i++) {
        node[i].children = node[i].children || [];
        let added = false;
        if (node[i]._id == auth.shared_resource.parent_resource._id) {
          node[i].children.push({
            label: auth.shared_resource.name,
            ...auth.shared_resource,
            icon:
              auth.shared_resource_type == "Course"
                ? "school"
                : auth.shared_resource_type == "RegistrationSection"
                ? "event_seat"
                : auth.shared_resource_type == "UserGroup"
                ? "groups"
                : auth.shared_resource_type == "Lecture"
                ? "book"
                : "error",
          });
          added = true;
        }
        if (!added) {
          this.addAuthToTree(node[i].children, auth, depth + 1);
        }
      }
    },
    buildTree() {
      const courseauths = this.me.auths.filter(
        (a) => a.shared_resource_type === "Course" && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
      );
      const sectionauths = this.me.auths.filter(
        (a) => a.shared_resource_type === "RegistrationSection" && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
      );
      const groupauths = this.me.auths.filter(
        (a) => a.shared_resource_type === "UserGroup" && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
      );
      const lectureauths = this.me.auths.filter(
        (a) => a.shared_resource_type === "Lecture" && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
      );
      let self = this;

      for (let i = 0; i < this.me.auths.length; i++) {
        if (["Course", "RegistrationSection", "UserGroup", "Lecture"].includes(this.me.auths[i].shared_resource_type)) {
          this.addAuthToTree(this.simple, this.me.auths[i], 0);
        }
      }
    },
  },
};
</script>

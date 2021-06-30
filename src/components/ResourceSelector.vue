<template>
  <div class="q-my-md q-pa-md neu-concave">
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
    selected_resource: function (val, oldVal) {
      if (val === oldVal) {
        return;
      } else if (!val) {
        this.$emit("change", val);
      } else {
        let selected_auth = this.me.auths.find((a) => a.shared_resource._id == val);
        if (this.selectable && !this.selectable.includes(selected_auth._id)) {
          this.selected_resource = oldVal;
          this.errorMsg('Resource is not marked as "selectable"');
        } else {
          this.$emit("change", val);
        }
      }
    },
    ticked: function (val, oldVal) {
      this.$emit("change", val);
    },
  },
  created() {
    this.selected_resource = this.selected ? this.selected : null;
    this.buildTree();
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
      if (node.length == 0 && depth == 0) {
        node.push({
          label: auth.shared_resource.name,
          ...auth.shared_resource,
          icon: auth.shared_resource_type == "Course" ? "school" : "school",
        });
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

      // courseauths.forEach(function (courseauth) {
      //   self.simple.push({
      //     label: courseauth.shared_resource.name,
      //     ...courseauth.shared_resource,
      //     icon: "school",
      //     // disabled: self.selectable && !self.selectable.includes(courseauth._id) ? true : false
      //   });
      // });
      // sectionauths.forEach(function (sectionauth) {
      //   let a = self.simple.find((a) => a._id == sectionauth.shared_resource.parent_resource._id);
      //   if (a) {
      //     if (!a.children) {
      //       a.children = [];
      //     }
      //     a.children.push({
      //       label: sectionauth.shared_resource.name,
      //       ...sectionauth.shared_resource,
      //       icon: "event_seat",
      //       disabled: self.selectable && !self.selectable.includes(sectionauth._id) ? true : false,
      //     });
      //   }
      // });
      // groupauths.forEach(function (groupauth) {
      //   let a = self.simple.find((a) => a._id == groupauth.shared_resource.parent_resource._id);
      //   if (a) {
      //     if (!a.children) {
      //       a.children = [];
      //     }
      //     a.children.push({
      //       label: groupauth.shared_resource.name,
      //       ...groupauth.shared_resource,
      //       icon: "groups",
      //       disabled: self.selectable && !self.selectable.includes(groupauth._id) ? true : false,
      //     });
      //   }
      // });
      // lectureauths.forEach(function (lectureauth) {
      //   let a = self.simple.find((a) => a._id == lectureauth.shared_resource.parent_resource._id);
      //   if (a) {
      //     if (!a.children) {
      //       a.children = [];
      //     }
      //     a.children.push({
      //       label: lectureauth.shared_resource.name,
      //       ...lectureauth.shared_resource,
      //       icon: "book",
      //       disabled: self.selectable && !self.selectable.includes(lectureauth._id) ? true : false,
      //     });
      //   }
      // });
    },
  },
};
</script>

<template>
  <div class="resource-selector q-mt-none q-mb-lg">
    {{ label || "Select a resource" }}
    <q-tree
      class="col-12"
      default-expand-all
      :nodes="simple"
      node-key="_id"
      :selected.sync="selected"
      :expanded.sync="expanded"
    />
  </div>
</template>

<script>
export default {
  props: {
    me: {
      type: Object,
      required: true
    },
    selectable: {
      type: Array,
      required: false
    },
    label: {
      type: String,
      required: false
    }
  },
  data() {
    return {
      simple: [],
      selected: null,
      ticked: [],
      expanded: []
    };
  },
  watch: {
    selected: function(val, oldVal) {
      this.$emit("change", val);
    }
  },
  created() {
    this.buildTree();
  },
  methods: {
    buildTree() {
      const courseauths = this.me.auths.filter(
        a => a.shared_resource_type === "Course" && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
      );
      const sectionauths = this.me.auths.filter(
        a => a.shared_resource_type === "RegistrationSection" && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
      );
      const groupauths = this.me.auths.filter(
        a => a.shared_resource_type === "UserGroup" && ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(a.role)
      );
      let self = this;
      courseauths.forEach(function(courseauth) {
        self.simple.push({
          label: courseauth.shared_resource.name,
          ...courseauth.shared_resource,
          icon: "school"
        });
      });
      sectionauths.forEach(function(sectionauth) {
        let a = self.simple.find(a => a._id == sectionauth.shared_resource.parent_resource._id);
        if (a) {
          if (!a.children) {
            a.children = [];
          }
          a.children.push({
            label: sectionauth.shared_resource.name,
            ...sectionauth.shared_resource,
            icon: "event_seat",
            disabled: self.selectable && !self.selectable.includes(sectionauth.shared_resource._id) ? true : false
          });
        }
      });
      groupauths.forEach(function(groupauth) {
        let a = self.simple.find(a => a._id == groupauth.shared_resource.parent_resource._id);
        if (a) {
          if (!a.children) {
            a.children = [];
          }
          a.children.push({
            label: groupauth.shared_resource.name,
            ...groupauth.shared_resource,
            icon: "groups",
            disabled: self.selectable && !self.selectable.includes(groupauth.shared_resource._id) ? true : false
          });
        }
      });
    }
  }
};
</script>

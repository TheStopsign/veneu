<template>
  <div class="q-my-md neu-concave" :class="nav ? 'neu-convex' : ''" style="overflow-x: auto">
    <div class="q-mx-md q-mt-md q-mb-xs">{{ label || "Select a resource" }}</div>
    <q-tree
      v-if="rendering"
      class="col-12 text-primary q-px-md q-pb-md q-py-xs"
      style="max-height: 30rem; min-height: 20rem; overflow-y: auto"
      default-expand-all
      :nodes="tree"
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
      tree: [],
      selected_resource: null,
      ticked: [],
      expanded: [],
      error: "",
      rendering: true,
      unbuilt: [],
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
          this.handleNav(selected_auth);
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
          this.handleNav(selected_auth);
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
  },
  methods: {
    handleNav(selected_auth) {
      if (selected_auth.shared_resource_type == "YTVideoStream") {
        location.href = "/watch/" + selected_auth.shared_resource._id;
        // this.$router.push({
        //   name: "Watch",
        //   params: { _id: selected_auth.shared_resource._id },
        // });
      } else {
        this.$router.push({
          name: selected_auth.shared_resource_type,
          params: { _id: selected_auth.shared_resource._id },
        });
      }
    },
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
                : auth.shared_resource_type == "YTVideoStream"
                ? "smart_display"
                : "error",
          });
          added = true;
        }
        if (!added) {
          this.addAuthToTree(node[i].children, auth, depth + 1);
        }
      }
    },
    initAddAuthToTree(auth) {
      this.rendering = false;
      this.addAuthToTree(this.tree, auth, 0);
      let self = this;
      this.$nextTick(function () {
        self.rendering = true;
      });
    },
    addFromUnbuilt(unbuilt) {
      while (unbuilt.length) {
        var i = unbuilt.length - 1,
          stop = 0;
        while (i >= stop) {
          this.addAuthToTree(this.tree, unbuilt[i], 0);
          unbuilt.splice(i--, 1);
        }
      }
    },
    buildTree() {
      var resourcemap = this.me.auths.groupByProperty("shared_resource_type");
      var buildOrder = ["Course", "RegistrationSection", "UserGroup", "Lecture", "YTVideoStream"];
      var i = 0,
        len = buildOrder.length;
      for (; i < len; i++) {
        if (resourcemap[buildOrder[i]]) {
          this.addFromUnbuilt(resourcemap[buildOrder[i]]);
        }
      }

      // for (let i = 0; i < this.me.auths.length; i++) {
      //   if (
      //     ["Course", "RegistrationSection", "UserGroup", "Lecture", "YTVideoStream"].includes(
      //       this.me.auths[i].shared_resource_type
      //     )
      //   ) {
      //     this.addAuthToTree(this.tree, this.me.auths[i], 0);
      //   }
      // }
    },
  },
};
</script>

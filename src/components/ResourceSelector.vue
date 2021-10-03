<template>
  <div class="q-my-md nav-tree" :class="flat ? '' : nav ? 'neu-convex' : 'neu-convex'" style="overflow-x: auto">
    <div class="q-mx-md q-mt-md q-mb-xs">
      <q-icon size="xs" name="account_tree" class="q-mr-sm q-pb-xs" />{{ label || "Select a resource" }}
    </div>
    <q-input borderless v-model="filter" label="Search..." class="q-mx-md q-mt-md q-px-md q-py-none neu-concave">
      <template v-slot:prepend>
        <q-icon name="search" />
      </template>
      <template v-slot:append v-if="filter">
        <q-icon name="close" @click="filter = ''" class="cursor-pointer text-dangerous" />
      </template>
    </q-input>
    <q-scroll-area
      style="max-height: 20rem; min-height: 3.125rem"
      :thumb-style="{
        right: '0.25rem',
        borderRadius: '0.25rem',
        backgroundColor: 'var(--veneu-blue)',
        width: '0.25rem',
        opacity: 1,
      }"
    >
      <q-tree
        ref="scrollContents"
        class="col-12 text-primary q-px-md q-py-xs q-pb-md"
        default-expand-all
        :nodes="tree"
        node-key="treeid"
        :selected.sync="selected_resource"
        :expanded.sync="expanded"
        :filter="filter"
        :filter-method="filterFn"
      />
    </q-scroll-area>
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
    scope: {
      required: false,
    },
    flat: { type: Boolean, required: false, default: false },
  },
  data() {
    return {
      tree: [],
      selected_resource: null,
      ticked: [],
      expanded: [],
      error: "",
      scopeRef: null,
      flatTree: [...this.me.auths],
      filter: "",
    };
  },
  beforeDestroy() {
    this.tree = [];
    this.flatTree = [];
    this.scopeRef = [];
    this.selected_resource = [];
  },
  mounted() {
    this.$refs.scrollContents.$el.parentElement.parentElement.parentElement.style.height =
      this.$refs.scrollContents.$el.offsetHeight + "px";
    this.$refs.scrollContents.$el.parentElement.style.position = "absolute";
  },
  watch: {
    $route: function (val, oldVal) {
      if (this.nav) {
        let selected_auth = this.flatTree.find((a) => a.shared_resource._id == val.params._id);
        if (selected_auth) {
          this.selected_resource = selected_auth.shared_resource._id;
        } else {
          this.selected_resource = null;
        }
      }
    },
    selected_resource: function (val, oldVal) {
      let selected_auth = this.flatTree.find((a) => a.shared_resource._id == val);
      let old_auth = this.flatTree.find((a) => a.shared_resource._id == oldVal);
      let route_auth = this.flatTree.find((a) => a.shared_resource._id == this.$route.params._id);
      if (this.nav) {
        if (selected_auth && ((route_auth && route_auth._id != selected_auth._id) || !route_auth)) {
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
        if (
          ((selected_auth && this.selectable.includes(selected_auth._id) && oldVal != null) || old_auth != null) &&
          ((route_auth && route_auth._id != selected_auth._id) || !route_auth)
        ) {
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
    this.tree = [];
    this.buildTree(this.flatTree);
    this.selected_resource = this.selected
      ? this.selected
      : this.nav && this.$route.params._id
      ? this.$route.params._id
      : null;
    if (this.scopeRef) {
      this.tree = this.scopeRef.children;
    }
  },
  methods: {
    filterFn(node, filter) {
      return (
        (node.label && node.label.toLowerCase().indexOf(filter.toLowerCase()) > -1) ||
        (node.shared_resource_type && node.shared_resource_type.toLowerCase().indexOf(filter.toLowerCase()) > -1)
      );
    },
    handleNav(selected_auth) {
      if (selected_auth.shared_resource_type == "YTVideoStream") {
        location.href = "/watch/" + selected_auth.shared_resource._id;
      } else if (selected_auth.shared_resource_type == "Checkin") {
        this.$router.push({
          name: "CheckinShow",
          params: { _id: selected_auth.shared_resource._id },
        });
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
    initAddAuthToTree(auth) {
      this.flatTree.push(auth);
      this.tree = [];
      this.buildTree(this.flatTree);
    },
    getAuthIcon: (shared_resource_type) =>
      shared_resource_type == "Course"
        ? "school"
        : shared_resource_type == "RegistrationSection"
        ? "event_seat"
        : shared_resource_type == "UserGroup"
        ? "groups"
        : shared_resource_type == "Lecture"
        ? "book"
        : shared_resource_type == "YTVideoStream"
        ? "smart_display"
        : shared_resource_type == "Checkin"
        ? "qr_code_2"
        : "error",
    buildTree(auths) {
      const data = [...auths];
      const idMapping = data.reduce((acc, auth, i) => {
        acc[auth.shared_resource._id] = i;
        return acc;
      }, {});

      const root = [];
      data.forEach((auth) => {
        // Handle the root element
        if (auth.shared_resource.parent_resource === null) {
          auth.children = [];
          auth.treeid = auth.shared_resource._id;
          auth.label = auth.shared_resource.name;
          auth.icon = this.getAuthIcon(auth.shared_resource_type);
          if (this.scope && auth.shared_resource._id == this.scope) {
            this.scopeRef = auth;
          }
          root.push(auth);
          return;
        }
        // Use our mapping to locate the parent element in our data array
        const parentEl = data[idMapping[auth.shared_resource.parent_resource._id]];

        // Add our current auth to its parent's `children` array
        auth.treeid = auth.shared_resource._id;
        auth.children = [];
        auth.label = auth.shared_resource.name;
        auth.icon = this.getAuthIcon(auth.shared_resource_type);
        if (this.scope && auth.shared_resource._id == this.scope) {
          this.scopeRef = auth;
        }
        parentEl.children.push(auth);
      });
      this.tree = root;
    },
  },
};
</script>

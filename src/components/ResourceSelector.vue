<template>
  <div :ref="randomID" class="nav-tree q-mt-sm" :class="flat ? '' : nav ? '' : ''" style="overflow-x: auto">
    <div class="q-mt-md">
      <q-icon size="xs" name="account_tree" class="q-mr-sm q-pb-xs" />{{ label || "Select a resource" }}
    </div>
    <q-input flat v-model="filter" label="Search..." standout="bg-primary text-white" class="q-mt-md q-py-none">
      <template v-slot:prepend>
        <q-icon name="search" />
      </template>
      <template v-slot:append v-if="filter">
        <q-icon name="close" @click="filter = ''" class="cursor-pointer" />
      </template>
    </q-input>
    <div class="neu-concave" style="max-height: 20rem; min-height: 3.125rem">
      <q-scroll-area
        class="neu-convex q-my-md"
        style="max-height: 20rem; min-height: 3.125rem"
        :bar-style="{
          top: '0.5rem',
        }"
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
          class="col-12 text-primary q-px-md q-py-md"
          default-expand-all
          :nodes="tree"
          node-key="treeid"
          :selected.sync="selected_resource"
          :expanded.sync="expanded"
          :filter="filter"
          :filter-method="filterFn"
        >
          <template v-slot:default-header="prop">
            <q-icon
              :name="prop.node.icon"
              class="q-mr-sm"
              :style="prop.node.selectable === false ? 'opacity: 0.5' : ''"
              :title="prop.node.label"
            />
            <div :style="prop.node.selectable === false ? 'opacity: 0.5' : ''" :title="prop.node.label">
              {{ prop.node.label }}
            </div>
          </template>
        </q-tree>
      </q-scroll-area>
    </div>
  </div>
</template>

<script>
import { scroll } from "quasar";
const { getScrollTarget, setScrollPosition, animScrollTo } = scroll;
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
      flatTree: [],
      filter: "",
      shared_with_me: null,
      randomID: "",
    };
  },
  created() {
    this.getRandomID();
    this.flatTree = [
      {
        _id: -1,
        shared_resource: {
          ...this.me,
          parent_resource: -1,
          parent_resource_type: null,
        },
        shared_resource_type: "User",
        children: [],
      },
      {
        _id: -2,
        shared_resource: {
          _id: -2,
          parent_resource: -2,
          parent_resource_type: null,
        },
        shared_resource_type: "Shared",
        children: [],
      },
    ];
    this.me.auths.forEach((auth) => {
      this.flatTree.push({
        ...auth,
      });
    }, this);
    this.shared_with_me = this.flatTree[1];
    this.tree = [];
    this.buildTree(this.flatTree);
    this.selected_resource = this.selected
      ? this.selected
      : this.nav && this.$route.params._id
      ? this.$route.params._id
      : this.nav && this.$route.name == "Me"
      ? this.me._id
      : null;
    if (this.scopeRef) {
      this.tree = this.scopeRef.children;
    }
  },
  mounted() {
    this.$refs.scrollContents.$el.parentElement.parentElement.parentElement.style.height =
      this.$refs.scrollContents.$el.offsetHeight + "px";
    this.$refs.scrollContents.$el.parentElement.style.position = "absolute";
    let self = this;
    this.scrollToSelected();
  },
  watch: {
    selected_resource: function (val, oldVal) {
      this.$emit("change", val);
    },
    ticked: function (val, oldVal) {
      this.$emit("change", val);
    },
  },
  methods: {
    getRandomID() {
      function dec2hex(dec) {
        return dec.toString(16).padStart(2, "0");
      }

      // generateId :: Integer -> String
      function generateId(len) {
        var arr = new Uint8Array((len || 40) / 2);
        window.crypto.getRandomValues(arr);
        return Array.from(arr, dec2hex).join("");
      }
      this.randomID = generateId(16);
    },
    scrollToSelected() {
      this.$refs[this.randomID].getElementsByClassName("q-tree__node--selected").forEach((a) => {
        let target = getScrollTarget(a),
          offset = a.getBoundingClientRect().top - target.scrollHeight + a.scrollHeight,
          duration = 0;
        setScrollPosition(target, offset, duration);
      });
    },
    filterFn(node, filter) {
      return (
        (node.label && node.label.toLowerCase().indexOf(filter.toLowerCase()) > -1) ||
        (node.shared_resource_type && node.shared_resource_type.toLowerCase().indexOf(filter.toLowerCase()) > -1)
      );
    },
    handleNav(selected_auth) {
      if (selected_auth) {
        if (selected_auth.shared_resource_type == "YTVideoStream") {
          location.href = "/watch/" + selected_auth.shared_resource._id;
        } else if (selected_auth.shared_resource_type == "User") {
          this.$router.push({
            name: "Me",
          });
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
        : shared_resource_type == "User"
        ? "face"
        : shared_resource_type == "Shared"
        ? "share"
        : "error",
    buildTree(auths) {
      const data = [...auths];
      const idMapping = data.reduce((acc, auth, i) => {
        acc[auth.shared_resource._id] = i;
        return acc;
      }, {});

      const root = [];
      let self = this;
      data.forEach((auth) => {
        auth.treeid = auth.shared_resource._id;
        auth.children = [];
        auth.label = auth.shared_resource.name;
        auth.icon = this.getAuthIcon(auth.shared_resource_type);
        if (
          this.selectable &&
          this.selectable.length &&
          !(this.selectable.includes(auth._id) || this.selectable.includes(auth.treeid))
        ) {
          auth.selectable = false;
          auth.handler = () => this.errorMsg("This resource is not selectable");
        } else if (this.nav) {
          auth.handler = () => this.handleNav(auth);
        }
        if (this.scope && auth.shared_resource._id == this.scope) {
          this.scopeRef = auth;
        }
      }, this);
      data.forEach((auth) => {
        if (auth.shared_resource.parent_resource === null || auth.shared_resource.parent_resource < 0) {
          root.push(auth);
          return;
        }
        const parentEl = data[idMapping[auth.shared_resource.parent_resource._id]];
        if (typeof parentEl == "undefined") {
          this.shared_with_me.children.push(auth);
          this.sortChildren(this.shared_with_me.children);
        } else {
          parentEl.children.push(auth);
          this.sortChildren(parentEl.children);
        }
      }, this);
      this.shared_with_me.label = "Shared with me";
      this.shared_with_me.selectable = false;
      this.shared_with_me.handler = () => this.errorMsg('"Shared with me" page coming soon');
      this.tree = root;
    },
    sortChildren(arr) {
      arr.sort((a, b) => {
        if (a.shared_resource_type == b.shared_resource_type) {
          return a.label > b.label;
        }
        return a.shared_resource_type > b.shared_resource_type;
      });
    },
  },
};
</script>

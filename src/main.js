import Vue from "vue";

import app from "./app.vue";
import "./registerServiceWorker";
import { createProvider } from "./vue-apollo";
import router from "./router";

import "./styles/quasar.scss";
import "./styles/veneu.scss";
import "quasar/dist/quasar.ie.polyfills";
import { Quasar, Notify } from "quasar";

import Plugin from "@quasar/quasar-ui-qcalendar";
import "@quasar/quasar-ui-qcalendar/dist/index.css";

Vue.use(Plugin);

Vue.use(Quasar, {
  config: {},
  plugins: { Notify }
});

Vue.config.productionTip = false;

Vue.directive("click-off", {
  bind: function(el, binding, vnode) {
    el.clickOutsideEvent = function(event) {
      // here I check that click was outside the el and his childrens
      if (!(el == event.target || el.contains(event.target))) {
        // and if it did, call method provided in attribute value
        vnode.context[binding.expression](event);
      }
    };
    document.body.addEventListener("click", el.clickOutsideEvent);
  },
  unbind: function(el) {
    document.body.removeEventListener("click", el.clickOutsideEvent);
  }
});

new Vue({
  apolloProvider: createProvider(),
  router,
  render: h => h(app)
}).$mount("#app");

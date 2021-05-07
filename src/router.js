import Vue from "vue";
import VueRouter from "vue-router";

import AdminOverview from "./components/AdminOverview";
import AdminUsers from "./components/AdminUsers";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import FirstTimeLogin from "./pages/FirstTimeLogin.vue";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Course from "./pages/Course.vue";
import RegistrationSection from "./pages/RegistrationSection.vue";
import Lecture from "./pages/Lecture.vue";

import CreateCourse from "./pages/CreateCourse.vue";
import CreateUserGroup from "./pages/CreateUserGroup.vue";
import CreateRegistrationSection from "./pages/CreateRegistrationSection.vue";
import CreateLecture from "./pages/CreateLecture.vue";
import Settings from "./components/Settings.vue";

import CheckinShow from "./pages/CheckinShow.vue";
import CheckinScan from "./pages/CheckinScan.vue";

Vue.use(VueRouter);

const router = new VueRouter({
  routes: [
    {
      path: "/admin",
      name: "AdminOverview",
      component: AdminOverview,
      meta: {
        auth: true
      }
    },
    {
      path: "/admin/users",
      name: "AdminUsers",
      component: AdminUsers,
      meta: {
        auth: true
      }
    },
    {
      path: "/dashboard",
      name: "Dashboard",
      component: Dashboard,
      meta: {
        auth: true
      }
    },
    {
      path: "/login",
      name: "Login",
      component: Login,
      meta: {
        noAuth: true
      }
    },
    {
      path: "/signup",
      name: "Signup",
      component: Signup,
      meta: {
        noAuth: true
      }
    },
    {
      path: "/",
      name: "Landing",
      component: Landing,
      meta: {
        noAuth: true
      }
    },
    {
      path: "/create-course",
      name: "CreateCourse",
      component: CreateCourse,
      meta: {
        auth: true
      }
    },
    {
      path: "/create-user-group",
      name: "CreateUserGroup",
      component: CreateUserGroup,
      meta: {
        auth: true
      }
    },
    {
      path: "/create-registration-section",
      name: "CreateRegistrationSection",
      component: CreateRegistrationSection,
      meta: {
        auth: true
      }
    },
    {
      path: "/course/:_id",
      name: "Course",
      component: Course,
      meta: {
        auth: true
      }
    },
    {
      path: "/checkin/:_id/show",
      name: "CheckinShow",
      component: CheckinShow,
      meta: {
        auth: true
      }
    },
    {
      path: "/checkin/scan",
      name: "CheckinScan",
      component: CheckinScan
    },
    {
      path: "/firstlogin/:access_code",
      name: "FirstTimeLogin",
      component: FirstTimeLogin
    },
    {
      path: "/registration-section/:_id",
      name: "RegistrationSection",
      component: RegistrationSection,
      meta: {
        auth: true
      }
    },
    {
      path: "/create-lecture",
      name: "CreateLecture",
      component: CreateLecture,
      meta: {
        auth: true
      }
    },
    {
      path: "/settings",
      name: "Settings",
      component: Settings,
      meta: {
        auth: false
      }
    },
    {
      path: "/lecture/:_id",
      name: "Lecture",
      component: Lecture,
      meta: {
        auth: true
      }
    }
  ],
  mode: "history"
});

router.beforeEach((to, from, next) => {
  if (to.meta.auth && !localStorage.getItem("token")) next({ name: "Login", query: { redirect: to.path } });
  else if (to.meta.noAuth && localStorage.getItem("token")) next({ name: "Dashboard" });
  else next();
});

export default router;

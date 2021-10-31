import Vue from "vue";
import VueRouter from "vue-router";

const Landing = () => import("./pages/Landing");
const NotFound = () => import("./pages/NotFound");
const Signup = () => import("./pages/Signup");
const FirstTimeLogin = () => import("./pages/FirstTimeLogin.vue");
const Login = () => import("./pages/Login");
const Calendar = () => import("./pages/Calendar");
const Timeline = () => import("./pages/Timeline");
const Course = () => import("./pages/Course.vue");
const RegistrationSection = () => import("./pages/RegistrationSection.vue");
const UserGroup = () => import("./pages/UserGroup.vue");
const Lecture = () => import("./pages/Lecture.vue");
const Me = () => import("./pages/Me.vue");

const CreateCourse = () => import("./pages/CreateCourse.vue");
const CreateUserGroup = () => import("./pages/CreateUserGroup.vue");
const CreateRegistrationSection = () => import("./pages/CreateRegistrationSection.vue");
const CreateLecture = () => import("./pages/CreateLecture.vue");
const CreateVideo = () => import("./pages/CreateVideo.vue");
const Settings = () => import("./components/Settings.vue");

const CheckinShow = () => import("./pages/CheckinShow.vue");
const CheckinScan = () => import("./pages/CheckinScan.vue");
const DesktopScan = () => import("./pages/DesktopScan.vue");

const Watch = () => import("./pages/Watch.vue");

Vue.use(VueRouter);

const router = new VueRouter({
  routes: [
    {
      path: "/calendar",
      name: "Calendar",
      component: Calendar,
      meta: {
        auth: true,
      },
    },
    {
      path: "/timeline",
      name: "Timeline",
      component: Timeline,
      meta: {
        auth: true,
      },
    },
    {
      path: "/login",
      name: "Login",
      component: Login,
      meta: {
        noAuth: true,
      },
    },
    {
      path: "/signup",
      name: "Signup",
      component: Signup,
      meta: {
        noAuth: true,
      },
    },
    {
      path: "/",
      name: "Landing",
      component: Landing,
      meta: {
        noAuth: true,
      },
    },
    {
      path: "/create-course",
      name: "CreateCourse",
      component: CreateCourse,
      meta: {
        auth: true,
      },
    },
    {
      path: "/create-user-group",
      name: "CreateUserGroup",
      component: CreateUserGroup,
      meta: {
        auth: true,
      },
    },
    {
      path: "/create-registration-section",
      name: "CreateRegistrationSection",
      component: CreateRegistrationSection,
      meta: {
        auth: true,
      },
    },
    {
      path: "/course/:_id",
      name: "Course",
      component: Course,
      meta: {
        auth: true,
      },
    },
    {
      path: "/checkin/:_id/show",
      name: "CheckinShow",
      component: CheckinShow,
      meta: {
        auth: true,
      },
    },
    {
      path: "/checkin/scan",
      name: "CheckinScan",
      component: CheckinScan,
    },
    {
      path: "/checkin/scan/desktop",
      name: "DesktopScan",
      component: DesktopScan,
    },
    {
      path: "/firstlogin/:access_code",
      name: "FirstTimeLogin",
      component: FirstTimeLogin,
    },
    {
      path: "/registration-section/:_id",
      name: "RegistrationSection",
      component: RegistrationSection,
      meta: {
        auth: true,
      },
    },
    {
      path: "/user-group/:_id",
      name: "UserGroup",
      component: UserGroup,
      meta: {
        auth: true,
      },
    },
    {
      path: "/create-lecture",
      name: "CreateLecture",
      component: CreateLecture,
      meta: {
        auth: true,
      },
    },
    {
      path: "/settings",
      name: "Settings",
      component: Settings,
      meta: {
        auth: false,
      },
    },
    {
      path: "/lecture/:_id",
      name: "Lecture",
      component: Lecture,
      meta: {
        auth: true,
      },
    },
    {
      path: "/watch/:_id",
      name: "Watch",
      component: Watch,
    },
    {
      path: "/create-video",
      name: "CreateVideo",
      component: CreateVideo,
    },
    {
      path: "/me",
      name: "Me",
      component: Me,
      meta: {
        auth: true,
      },
    },
    {
      path: "/404",
      name: "404",
      component: NotFound,
    },
    {
      path: "/*",
      redirect: "/404",
    },
  ],
  mode: "history",
});

router.beforeEach((to, from, next) => {
  if (to.meta.auth && !localStorage.getItem("token")) next({ name: "Login", query: { redirect: to.path } });
  else if (to.meta.noAuth && localStorage.getItem("token")) next({ name: "Calendar" });
  else next();
});

export default router;

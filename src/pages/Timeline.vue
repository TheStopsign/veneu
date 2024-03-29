<template>
  <q-page id="dashboard" class="q-pb-md" style="height: 100%">
    <div v-if="events" style="position: absolute; height: 100%; width: 100%; display: flex; flex-direction: column">
      <div
        class="q-px-md q-my-none"
        style="display: flex; flex-direction: column; height: 100%; width: 100%; overflow: auto"
      >
        <q-timeline :layout="layout" color="primary" v-if="events">
          <q-timeline-entry class="text-primary" heading> Timeline </q-timeline-entry>

          <q-timeline-entry
            :title="evt.type + ' - ' + evt.name"
            :subtitle="getFormattedDate(evt.start)"
            side="left"
            v-for="evt in getSorted(events)"
            :key="evt._id"
            icon="class"
          >
            <div>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua.
            </div>
          </q-timeline-entry>
        </q-timeline>
      </div>
    </div>
  </q-page>
</template>

<script>
import gql from "graphql-tag";
import { date } from "quasar";
import QCalendar from "@quasar/quasar-ui-qcalendar"; // ui is aliased from '@quasar/quasar-ui-qcalendar'

const CURRENT_DAY = new Date();

function getCurrentDay(day) {
  const newDay = new Date(CURRENT_DAY);
  newDay.setDate(day);
  const tm = QCalendar.parseDate(newDay);
  return tm.date;
}

const reRGBA = /^\s*rgb(a)?\s*\((\s*(\d+)\s*,\s*?){2}(\d+)\s*,?\s*([01]?\.?\d*?)?\s*\)\s*$/;

function textToRgb(color) {
  if (typeof color !== "string") {
    throw new TypeError("Expected a string");
  }

  const m = reRGBA.exec(color);
  if (m) {
    const rgb = {
      r: Math.min(255, parseInt(m[2], 10)),
      g: Math.min(255, parseInt(m[3], 10)),
      b: Math.min(255, parseInt(m[4], 10)),
    };
    if (m[1]) {
      rgb.a = Math.min(1, parseFloat(m[5]));
    }
    return rgb;
  }
  return hexToRgb(color);
}

function hexToRgb(hex) {
  if (typeof hex !== "string") {
    throw new TypeError("Expected a string");
  }

  hex = hex.replace(/^#/, "");

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  } else if (hex.length === 4) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  const num = parseInt(hex, 16);

  return hex.length > 6
    ? { r: (num >> 24) & 255, g: (num >> 16) & 255, b: (num >> 8) & 255, a: Math.round((num & 255) / 2.55) }
    : { r: num >> 16, g: (num >> 8) & 255, b: num & 255 };
}

function luminosity(color) {
  if (typeof color !== "string" && (!color || color.r === undefined)) {
    throw new TypeError("Expected a string or a {r, g, b} object as color");
  }

  const rgb = typeof color === "string" ? textToRgb(color) : color,
    r = rgb.r / 255,
    g = rgb.g / 255,
    b = rgb.b / 255,
    R = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4),
    G = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4),
    B = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export default {
  name: "Calendar",
  props: {
    me: Object,
  },
  data() {
    return {
      tab: "calendar",
      intervalId: null,
      timeStartPos: 0,
      selectedDate: "",
      events: [],
    };
  },
  created() {
    let self = this;
    this.$apollo
      .query({
        query: gql`
          query {
            calendarEvents {
              _id
              name
              start
              end
              type
            }
          }
        `,
      })
      .then(({ data: { calendarEvents } }) => {
        calendarEvents.forEach(function (evt) {
          self.events.push({
            ...evt,
            title: evt.name,
            date: date.formatDate(evt.start, "YYYY-MM-DD"),
            time: date.formatDate(evt.start, "HH:mm"),
            duration: (new Date(evt.end) - new Date(evt.start)) / 1000 / 60,
            bgcolor: "primary",
            icon: "class",
          });
        });
        this.setTime();
      })
      .catch((e) => e);
  },
  beforeDestroy() {
    clearInterval(this.intervalId);
  },
  computed: {
    // convert the events into a map of lists keyed by date
    eventsMap() {
      const map = {};
      this.events.forEach((event) => (map[event.date] = map[event.date] || []).push(event));
      return map;
    },
    style() {
      return {
        top: this.timeStartPos + "px",
      };
    },
    layout() {
      return this.$q.screen.lt.sm ? "dense" : this.$q.screen.lt.md ? "comfortable" : "loose";
    },
  },
  methods: {
    onClickInterval({ event }) {
      if (event.target.id) {
        if (event.target.classList.contains("Lecture")) {
          this.$router.push({ name: "Lecture", params: { _id: event.target.id } });
        }
      }
    },
    getFormattedDate(d) {
      return date.formatDate(d, "MMM Do, YYYY @ h:mma");
    },
    getSorted(vals) {
      return [...vals].sort(function (a, b) {
        return new Date(a.start) - new Date(b.start);
      });
    },
    setTime() {
      this.adjustCurrentTime();
      // now, adjust the time every minute
      this.intervalId = setInterval(() => {
        this.adjustCurrentTime();
      }, 60000);
    },
    calendarNext() {
      this.$refs.calendar.next();
    },
    calendarPrev() {
      this.$refs.calendar.prev();
    },
    isCssColor(color) {
      return !!color && !!color.match(/^(#|(rgb|hsl)a?\()/);
    },

    badgeClasses(event, type) {
      const cssColor = this.isCssColor(event.bgcolor);
      const isHeader = type === "header";
      return {
        [`text-white bg-${event.bgcolor}`]: !cssColor,
        "full-width": !isHeader && (!event.side || event.side === "full"),
        "left-side": !isHeader && event.side === "left",
        "right-side": !isHeader && event.side === "right",
      };
    },

    badgeStyles(event, type, timeStartPos, timeDurationHeight) {
      const s = {};
      if (this.isCssColor(event.bgcolor)) {
        s["background-color"] = event.bgcolor;
        s.color = luminosity(event.bgcolor) > 0.5 ? "black" : "white";
      }
      if (timeStartPos) {
        s.top = timeStartPos(event.time) + "px";
      }
      if (timeDurationHeight) {
        s.height = timeDurationHeight(event.duration) + "px";
      }
      s["align-items"] = "flex-start";
      return s;
    },

    getEvents(dt) {
      const currentDate = QCalendar.parsed(dt);
      const events = [];
      for (let i = 0; i < this.events.length; ++i) {
        let added = false;
        if (this.events[i].date === dt) {
          if (this.events[i].time) {
            if (events.length > 0) {
              // check for overlapping times
              const startTime = QCalendar.parsed(this.events[i].date + " " + this.events[i].time);
              const endTime = QCalendar.addToDate(startTime, { minute: this.events[i].duration });
              for (let j = 0; j < events.length; ++j) {
                if (events[j].time) {
                  const startTime2 = QCalendar.parsed(events[j].date + " " + events[j].time);
                  const endTime2 = QCalendar.addToDate(startTime2, { minute: events[j].duration });
                  if (
                    QCalendar.isBetweenDates(startTime, startTime2, endTime2) ||
                    QCalendar.isBetweenDates(endTime, startTime2, endTime2)
                  ) {
                    events[j].side = "left";
                    this.events[i].side = "right";
                    events.push(this.events[i]);
                    added = true;
                    break;
                  }
                }
              }
            }
          }
          if (!added) {
            this.events[i].side = undefined;
            events.push(this.events[i]);
          }
        } else if (this.events[i].days) {
          // check for overlapping dates
          const startDate = QCalendar.parsed(this.events[i].date);
          const endDate = QCalendar.addToDate(startDate, { day: this.events[i].days });
          if (QCalendar.isBetweenDates(currentDate, startDate, endDate)) {
            events.push(this.events[i]);
            added = true;
          }
        }
      }
      return events;
    },
    adjustCurrentTime() {
      const now = new Date();
      const p = QCalendar.parseDate(now);
      this.currentDate = p.date;
      this.currentTime = p.time;
      this.timeStartPos = this.$refs.calendar.timeStartPos(this.currentTime);
    },
  },
};
</script>

<style scoped>
.q-tab-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
</style>

<style lang="sass">
.calendar-container
  position: relative

.my-event
  width: 100%
  position: absolute
  font-size: 12px

.full-width
  left: 0
  width: 100%

.left-side
  left: 0
  width: 49.75%

.right-side
  left: 50.25%
  width: 49.75%

.week-view-current-time-indicator
  position: absolute
  left: 45px
  height: 10px
  width: 10px
  margin-top: -4px
  background-color: var(--veneu-red);
  border-radius: 50%

.week-view-current-time-line
  position: absolute
  left: 55px
  border-top: var(--veneu-red) 2px solid
  width: calc(100% - 50px - 5px)

.body--dark
  .week-view-current-time-indicator
    background-color: var(--veneu-red)

  .week-view-current-time-line
    border-top: var(--veneu-red) 2px solid
</style>

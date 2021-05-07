<template>
  <ApolloQuery :query="require('../graphql/Courses.gql')">
    <template slot-scope="{ result: { loading, error, data } }">
      <div v-if="loading">Loading...</div>
      <div v-if="error">Error...</div>
      <div v-if="data">
        <q-item-label header class="text-primary q-pb-md special-font row justify-between">
          Courses
        </q-item-label>
        <q-item-label header class="text-primary q-pb-md special-font">Instructor for...</q-item-label>
        <q-expansion-item
          v-for="course in data.courses.filter(
            c => c.auths.filter(a => a.role == 'INSTRUCTOR' && a.user.email == me.email).length
          )"
          :key="course._id + '_INST'"
          expand-icon-toggle
          icon="school"
          class="courses"
          expand-icon-class="text-primary"
          :header-inset-level="0"
          :content-inset-level="0.5"
          group="courseGroup"
        >
          <q-item
            slot="header"
            class="col q-pl-md q-py-sm q-mr-sm q-pr-none"
            :clickable="$route.name != 'Course' || $route.params._id != course._id"
            @click="$router.push({ name: 'Course', params: { _id: course._id } })"
          >
            <q-item-section avatar>
              <q-icon name="school" />
            </q-item-section>

            <q-item-section :title="course.name">
              <q-item-label>{{ course.name }}</q-item-label>
              <q-item-label caption> {{ course.auths.filter(a => a.role == "STUDENT").length }} students </q-item-label>
            </q-item-section>
          </q-item>
          <q-list class="rounded-borders">
            <q-list class="rounded-borders">
              <q-expansion-item
                expand-icon-toggle
                icon="event_seat"
                class="q-pr-none"
                expand-icon-class="text-primary"
                v-for="section of course.registration_sections"
                :key="section._id"
                :header-inset-level="0"
                :content-inset-level="0.5"
              >
                <q-item
                  slot="header"
                  class="col q-px-md q-py-sm q-mr-sm"
                  :clickable="$route.name != 'RegistrationSection' || $route.params._id != section._id"
                  @click="$router.push({ name: 'RegistrationSection', params: { _id: section._id } })"
                >
                  <q-item-section avatar>
                    <q-icon name="event_seat" />
                  </q-item-section>

                  <q-item-section :title="section.name">
                    <q-item-label>{{ section.name }}</q-item-label>
                    <q-item-label caption>
                      {{ section.auths.filter(a => a.role == "STUDENT").length }} students
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-list class="rounded-borders">
                  <q-item
                    clickable
                    class="cursor-pointer q-pr-sm"
                    v-for="group of section.user_groups"
                    :key="group._id"
                    :title="group.name"
                  >
                    <q-item-section avatar>
                      <q-icon name="group" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>{{ group.name }}</q-item-label>
                      <q-item-label caption>
                        {{ group.auths.filter(a => a.role == "STUDENT").length }} students
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
            </q-list>
            <q-list class="rounded-borders">
              <q-item
                clickable
                class="cursor-pointer q-pr-sm"
                v-for="group of course.user_groups"
                :key="group._id"
                :title="group.name"
              >
                <q-item-section avatar>
                  <q-icon name="groups" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>{{ group.name }}</q-item-label>
                  <q-item-label caption>
                    {{ group.auths.filter(a => a.role == "STUDENT").length }} students
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-list>
        </q-expansion-item>
        <q-item-label header class="text-primary q-pb-md special-font">Teaching Assistant for...</q-item-label>
        <q-expansion-item
          v-for="course in data.courses.filter(
            c => c.auths.filter(a => a.role == 'TEACHING_ASSISTANT' && a.user.email == me.email).length
          )"
          :key="course._id + '_TA'"
          expand-icon-toggle
          icon="school"
          class="courses"
          expand-icon-class="text-primary"
          :header-inset-level="0"
          :content-inset-level="0.5"
          group="courseGroup"
        >
          <q-item
            slot="header"
            class="col q-pl-md q-py-sm q-mr-sm q-pr-none"
            clickable
            :to="{ name: 'Course', params: { _id: course._id } }"
          >
            <q-item-section avatar>
              <q-icon name="school" />
            </q-item-section>

            <q-item-section :title="course.name">
              <q-item-label>{{ course.name }}</q-item-label>
              <q-item-label caption> {{ course.auths.filter(a => a.role == "STUDENT").length }} students </q-item-label>
            </q-item-section>
          </q-item>
          <q-list class="rounded-borders">
            <q-list class="rounded-borders">
              <q-expansion-item
                expand-icon-toggle
                icon="event_seat"
                class="q-pr-none"
                expand-icon-class="text-primary"
                v-for="section of course.registration_sections"
                :key="section._id"
                :header-inset-level="0"
                :content-inset-level="0.5"
              >
                <q-item slot="header" class="col q-px-md q-py-sm q-mr-sm" clickable>
                  <q-item-section avatar>
                    <q-icon name="event_seat" />
                  </q-item-section>

                  <q-item-section :title="section.name">
                    <q-item-label>{{ section.name }}</q-item-label>
                    <q-item-label caption>
                      {{ section.auths.filter(a => a.role == "STUDENT").length }} students
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <div class="q-px-md">
                  <q-btn
                    dense
                    size="sm"
                    flat
                    class="full-width q-my-sm"
                    label="Group"
                    icon="add"
                    :to="{ path: '/create-user-group?parent_resource=' + (section._id ? section._id : '') }"
                  />
                </div>
                <q-list class="rounded-borders">
                  <q-item
                    clickable
                    class="cursor-pointer q-pr-sm"
                    v-for="group of section.user_groups"
                    :key="group._id"
                    :title="group.name"
                  >
                    <q-item-section avatar>
                      <q-icon name="group" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>{{ group.name }}</q-item-label>
                      <q-item-label caption>
                        {{ group.auths.filter(a => a.role == "STUDENT").length }} students
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
            </q-list>
            <q-list class="rounded-borders">
              <q-item
                :clickable="$route.name != 'UserGroup' || $route.params._id != group._id"
                class="cursor-pointer q-pr-sm"
                v-for="group of course.user_groups"
                :key="group._id"
                :title="group.name"
              >
                <q-item-section avatar>
                  <q-icon name="groups" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>{{ group.name }}</q-item-label>
                  <q-item-label caption>
                    {{ group.auths.filter(a => a.role == "STUDENT").length }} students
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-list>
        </q-expansion-item>
        <q-item-label header class="text-primary q-pb-md special-font row justify-between items-center">
          Student for...
          <q-btn disabled size="sm" label="Join" icon="group_add" />
        </q-item-label>
        <q-expansion-item
          v-for="course in data.courses.filter(
            c => c.auths.filter(a => a.role == 'STUDENT' && a.user.email == me.email).length
          )"
          :key="course._id + '_STUD'"
          expand-icon-toggle
          icon="school"
          class="courses"
          expand-icon-class="text-primary"
          :header-inset-level="0"
          :content-inset-level="0.5"
          group="courseGroup"
        >
          <q-item
            slot="header"
            class="col q-pl-md q-py-sm q-mr-sm q-pr-none"
            clickable
            :to="{ name: 'Course', params: { _id: course._id } }"
          >
            <q-item-section avatar>
              <q-icon name="school" />
            </q-item-section>

            <q-item-section :title="course.name">
              <q-item-label>{{ course.name }}</q-item-label>
              <q-item-label caption> {{ course.auths.filter(a => a.role == "STUDENT").length }} students </q-item-label>
            </q-item-section>
          </q-item>
          <q-list class="rounded-borders">
            <q-list class="rounded-borders">
              <q-expansion-item
                expand-icon-toggle
                icon="event_seat"
                class="q-pr-none"
                expand-icon-class="text-primary"
                v-for="section of course.registration_sections"
                :key="section._id"
                :header-inset-level="0"
                :content-inset-level="0.5"
              >
                <q-item slot="header" class="col q-px-md q-py-sm q-mr-sm" clickable>
                  <q-item-section avatar>
                    <q-icon name="event_seat" />
                  </q-item-section>

                  <q-item-section :title="section.name">
                    <q-item-label>{{ section.name }}</q-item-label>
                    <q-item-label caption>
                      {{ section.auths.filter(a => a.role == "STUDENT").length }} students
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-list class="rounded-borders">
                  <q-item
                    clickable
                    class="cursor-pointer q-pr-sm"
                    v-for="group of section.user_groups"
                    :key="group._id"
                    :title="group.name"
                  >
                    <q-item-section avatar>
                      <q-icon name="group" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>{{ group.name }}</q-item-label>
                      <q-item-label caption>
                        {{ group.auths.filter(a => a.role == "STUDENT").length }} students
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
            </q-list>
            <q-list class="rounded-borders">
              <q-item
                clickable
                class="cursor-pointer q-pr-sm"
                v-for="group of course.user_groups"
                :key="group._id"
                :title="group.name"
              >
                <q-item-section avatar>
                  <q-icon name="groups" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>{{ group.name }}</q-item-label>
                  <q-item-label caption>
                    {{ group.auths.filter(a => a.role == "STUDENT").length }} students
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-list>
        </q-expansion-item>
      </div>
    </template>
  </ApolloQuery>
</template>

<script>
export default {
  name: "CourseList",
  props: {
    me: Object
  },
  data() {
    return {
      editing: false
    };
  }
};
</script>

<style scoped></style>

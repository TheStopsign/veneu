
<template>
  <q-page id="settings" class="q-pb-md">
    <q-form @submit.prevent="formValid && mutate()" class="q-gutter-y-md q-pa-lg q-ma-lg neu-convex">
        <q-item-label header class="text-primary q-pb-md special-font row justify-between">
        Change Account Information
        </q-item-label>
        <q-input 
            standout="bg-primary text-white" 
            color="primary" 
            v-model="email" 
            label="Email" 
            class="q-mt-sm">
            <template v-slot:prepend>
            <q-icon name="email" />
            </template>
        </q-input>
        <q-input
            type="password"
            standout="bg-primary text-white"
            color="primary"
            v-model="password"
            label="Password"
        >
            <template v-slot:prepend>
            <q-icon name="password" />
            </template>
        </q-input>
        <q-input
            type="first"
            standout="bg-primary text-white"
            color="primary"
            v-model="first_name"
            label="First Name"
        >
            <template v-slot:prepend>
            <q-icon name="password" />
            </template>
        </q-input>
        <q-input
            type="last"
            standout="bg-primary text-white"
            color="primary"
            v-model="last_name"
            label="Last / Family Name"
        >
            <template v-slot:prepend>
            <q-icon name="password" />
            </template>
        </q-input>
        <div class="row full-width justify-between items-center q-mb-md q-px-md">
          <q-btn flat label="Submit Changes" @click="calendarNext" />
        </div>
    </q-form>
  </q-page>
</template>

<script>

</script>

<style scoped></style>

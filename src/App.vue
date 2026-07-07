<template>
  <v-app v-if="isAdminRoute">
    <v-app-bar color="primary" density="comfortable">
      <v-app-bar-title>PeriodePlanner</v-app-bar-title>
      <template #append>
        <v-btn
          v-for="item in navigationItems"
          :key="item.to"
          variant="text"
          color="white"
          :prepend-icon="item.icon"
          :to="item.to"
        >
          {{ item.title }}
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>

  <router-view v-else />
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      navigationItems: [
        { title: 'Planner', to: '/', icon: 'mdi-calendar-month-outline' },
        { title: 'Upload', to: '/upload', icon: 'mdi-file-upload-outline' },
        { title: 'Settings', to: '/settings', icon: 'mdi-cog-outline' },
      ],
    }
  },
  computed: {
    isAdminRoute() {
      return ['upload', 'settings'].includes(this.$route.name)
    },
  },
}
</script>

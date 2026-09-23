<template>
  <v-app v-if="isAdminRoute" class="pp-screen-only">
    <v-app-bar v-if="showNavigation" color="primary" density="comfortable">
      <v-app-bar-title>VooruitPlanner</v-app-bar-title>
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
        { title: 'Bulkexport', to: '/export', icon: 'mdi-file-export-outline' },
        { title: 'Bewerklijst', to: '/bewerklijst', icon: 'mdi-playlist-edit' },
      ],
    }
  },
  computed: {
    isAdminRoute() {
      return ['bulkExport', 'subjectEdit', 'editIndex'].includes(this.$route.name)
    },
    // De bewerkschermen zijn werkschermen voor docenten; die houden de
    // beheerbalk uit beeld.
    showNavigation() {
      return !['subjectEdit', 'editIndex'].includes(this.$route.name)
    },
  },
}
</script>

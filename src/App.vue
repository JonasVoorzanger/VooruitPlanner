<template>
  <div v-if="message" class="app-message">
    <p>{{ message }}</p>
  </div>

  <v-app v-else-if="isAdminRoute" class="pp-screen-only">
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
import { usePlannerStore } from './stores/planner'

export default {
  name: 'App',
  data() {
    return {
      plannerStore: usePlannerStore(),
      navigationItems: [
        { title: 'Planner', to: '/', icon: 'mdi-calendar-month-outline' },
        { title: 'Bulkexport', to: '/export', icon: 'mdi-file-export-outline' },
        { title: 'Bewerklijst', to: '/bewerklijst', icon: 'mdi-playlist-edit' },
      ],
    }
  },
  computed: {
    message() {
      switch (this.plannerStore.status) {
        case 'not-found':
          return 'Deze school kennen we niet.'
        case 'error':
          return 'De planning kon niet worden geladen. Controleer je verbinding en probeer het opnieuw.'
        default:
          return ''
      }
    },
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

<style scoped>
.app-message {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--bg);
  color: var(--muted);
  text-align: center;
}
</style>

<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      color="surface"
      :temporary="!$vuetify.display.mdAndUp"
      :permanent="$vuetify.display.mdAndUp"
      width="260"
    >
      <v-list nav>
        <v-list-subheader>PeriodePlanner</v-list-subheader>
        <v-list-item
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="lg"
          link
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="primary" density="comfortable">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title>PeriodePlanner</v-app-bar-title>
      <template #append>
        <v-btn
          v-for="item in navigationItems"
          :key="`${item.to}-top`"
          class="d-none d-md-inline-flex"
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
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      drawer: false,
      navigationItems: [
        { title: 'Planner', to: '/', icon: 'mdi-calendar-month-outline' },
        { title: 'Upload', to: '/upload', icon: 'mdi-file-upload-outline' },
        { title: 'Settings', to: '/settings', icon: 'mdi-cog-outline' },
      ],
    }
  },
  watch: {
    $route() {
      this.drawer = false
    },
  },
}
</script>

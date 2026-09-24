<template>
  <div v-if="notFound" class="app-message">
    <div>
      <h1>Deze school kennen we niet</h1>
      <p>
        Op <span class="pp-mono">{{ host }}/{{ $route.params.school }}</span> staat geen planner. Misschien zit er
        een tikfout in het adres, of is de school nog niet goedgekeurd.
      </p>
      <router-link class="app-message-link" to="/">Zoek je school</router-link>
    </div>
  </div>

  <div v-else-if="loadError" class="app-message">
    <p>De planning kon niet worden geladen. Controleer je verbinding en probeer het opnieuw.</p>
  </div>

  <!-- Een andere school wordt geladen; de schermen verwachten een geladen school. -->
  <div v-else-if="inSchool && plannerStore.status !== 'ready'" class="app-message" aria-busy="true"></div>

  <template v-else>
    <div v-if="showPendingBanner" class="pending-banner pp-screen-only" role="status">
      <span class="mdi mdi-clock-outline" aria-hidden="true"></span>
      <span>
        Deze school is nog niet goedgekeurd. Alleen beheerders zien deze pagina, op dit tijdelijke adres.
        <template v-if="school.requestedSlug">
          Na goedkeuring staat de planner op
          <strong class="pp-mono">{{ host }}/{{ school.requestedSlug }}</strong>.
        </template>
      </span>
    </div>

    <v-app v-if="isAdminRoute" class="pp-screen-only">
      <v-app-bar v-if="showNavigation" color="primary" density="comfortable">
        <v-app-bar-title>{{ schoolName || 'VooruitPlanner' }}</v-app-bar-title>
        <template #append>
          <v-btn
            v-for="item in navigationItems"
            :key="item.to"
            variant="text"
            color="white"
            :prepend-icon="item.icon"
            :to="item.to"
            exact
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
</template>

<script>
import { useTheme as useVuetifyTheme } from 'vuetify'
import { usePlannerStore } from './stores/planner'

const DEFAULT_PRIMARY = '#1f5fa7'
const DEFAULT_THEME_COLOR = '#3b4ea8'

export default {
  name: 'App',
  setup() {
    return { vuetifyTheme: useVuetifyTheme() }
  },
  data() {
    return {
      plannerStore: usePlannerStore(),
      host: window.location.host,
    }
  },
  computed: {
    inSchool() {
      return Boolean(this.$route.params.school)
    },
    notFound() {
      return this.inSchool && this.plannerStore.status === 'not-found'
    },
    loadError() {
      return this.inSchool && this.plannerStore.status === 'error'
    },
    school() {
      return this.inSchool && this.plannerStore.status === 'ready' ? this.plannerStore.school : null
    },
    schoolName() {
      return this.school?.name || ''
    },
    showPendingBanner() {
      return Boolean(this.school) && this.plannerStore.isPending
    },
    navigationItems() {
      const base = this.plannerStore.basePath
      return [
        { title: 'Planner', to: base, icon: 'mdi-calendar-month-outline' },
        { title: 'Bulkexport', to: `${base}/export`, icon: 'mdi-file-export-outline' },
        { title: 'Bewerklijst', to: `${base}/bewerklijst`, icon: 'mdi-playlist-edit' },
      ]
    },
    isAdminRoute() {
      return ['bulkExport', 'subjectEdit', 'editIndex'].includes(this.$route.name)
    },
    // De bewerkschermen zijn werkschermen voor docenten; die houden de
    // beheerbalk uit beeld.
    showNavigation() {
      return !['subjectEdit', 'editIndex'].includes(this.$route.name)
    },
    schoolColor() {
      const color = String(this.school?.color || '')
      return /^#[0-9a-f]{6}$/i.test(color) ? color : ''
    },
  },
  watch: {
    schoolName: {
      handler(name) {
        document.title = name ? `${name} · VooruitPlanner` : 'VooruitPlanner'
      },
      immediate: true,
    },
    // De kleur van de school wordt het accent; zie style.css.
    schoolColor: {
      handler(color) {
        const root = document.documentElement
        if (color) {
          root.style.setProperty('--school-color', color)
          root.dataset.schoolColor = ''
        } else {
          root.style.removeProperty('--school-color')
          delete root.dataset.schoolColor
        }
        this.vuetifyTheme.themes.value.schoolLight.colors.primary = color || DEFAULT_PRIMARY
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color || DEFAULT_THEME_COLOR)
      },
      immediate: true,
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

.app-message > div {
  max-width: 460px;
}

.app-message h1 {
  margin: 0 0 10px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text);
}

.app-message p {
  line-height: 1.5;
}

.app-message-link {
  display: inline-flex;
  align-items: center;
  height: 44px;
  margin-top: 8px;
  padding: 0 20px;
  border-radius: 11px;
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 600;
  text-decoration: none;
}

.app-message-link:hover {
  background: var(--accent-hover);
}

.pending-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 16px;
  background: var(--warn-soft);
  border-bottom: 1px solid var(--warn-border);
  color: color-mix(in oklab, var(--warn) 45%, var(--text));
  font-size: 13.5px;
  line-height: 1.45;
}

.pending-banner .mdi {
  font-size: 18px;
  line-height: 1.1;
  color: var(--warn);
}
</style>

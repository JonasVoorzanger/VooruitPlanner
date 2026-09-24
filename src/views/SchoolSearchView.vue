<template>
  <div class="screen">
    <div class="panel">
      <div class="brand">
        <div class="logo pp-mono">V</div>
        <div class="brand-name">VooruitPlanner</div>
      </div>

      <h1 class="heading">Zoek je school</h1>
      <p class="intro">Toetsen, planning en schoolactiviteiten per week, afgestemd op jouw leerjaar en vakken.</p>

      <router-link v-if="previous" class="continue" :to="`/${previous.address}`">
        <span>Verder naar <strong>{{ previous.name }}</strong></span>
        <span class="mdi mdi-arrow-right" aria-hidden="true"></span>
      </router-link>

      <label class="search">
        <span class="mdi mdi-magnify" aria-hidden="true"></span>
        <input
          ref="input"
          v-model="search"
          type="search"
          placeholder="Naam van je school"
          aria-label="Naam van je school"
          autocomplete="off"
          @keydown.enter="openFirst"
        />
      </label>

      <p v-if="status === 'loading' && search" class="hint">Scholen laden…</p>
      <p v-else-if="status === 'error'" class="hint">
        De scholen konden niet worden geladen. Controleer je verbinding en probeer het opnieuw.
      </p>
      <template v-else-if="search.trim()">
        <ul v-if="results.length" class="results">
          <li v-for="school in results" :key="school.id">
            <router-link class="result" :to="`/${school.slug}`">
              <span class="result-name">{{ school.name }}</span>
              <span class="result-address pp-mono">{{ host }}/{{ school.slug }}</span>
            </router-link>
          </li>
        </ul>
        <p v-else class="hint">
          Geen school gevonden met “{{ search.trim() }}”. Staat je school er niet tussen, dan gebruikt hij
          VooruitPlanner (nog) niet.
        </p>
      </template>

      <p class="footer">Aanmelden als school en inloggen voor beheerders komen binnenkort.</p>
    </div>
  </div>
</template>

<script>
import { lastSchool, loadActiveSchools, matchSchools } from '../utils/schools'

const MAX_RESULTS = 8

// Op het beginscherm geïnstalleerd opent de app op de voorpagina; wie al een
// school heeft, gaat dan meteen door.
function launchedFromHomeScreen() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export default {
  name: 'SchoolSearchView',
  beforeRouteEnter(to, from, next) {
    const previous = lastSchool()
    if (from.matched.length === 0 && previous && launchedFromHomeScreen()) {
      next(`/${previous.address}`)
      return
    }
    next()
  },
  data() {
    return {
      host: window.location.host,
      previous: lastSchool(),
      search: '',
      schools: [],
      // 'loading' | 'ready' | 'error'
      status: 'loading',
    }
  },
  computed: {
    results() {
      return matchSchools(this.schools, this.search).slice(0, MAX_RESULTS)
    },
  },
  async created() {
    try {
      this.schools = await loadActiveSchools()
      this.status = 'ready'
    } catch (error) {
      console.error(error)
      this.status = 'error'
    }
  },
  mounted() {
    // Op een telefoon zou het toetsenbord meteen het scherm vullen.
    if (!this.previous && window.matchMedia?.('(pointer: fine)').matches) {
      this.$refs.input.focus()
    }
  },
  methods: {
    openFirst() {
      if (this.results.length) {
        this.$router.push(`/${this.results[0].slug}`)
      }
    },
  },
}
</script>

<style scoped>
.screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
}

.panel {
  width: 100%;
  max-width: 560px;
  animation: pp-fade 0.4s ease both;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 26px;
}

.logo {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-weight: 700;
  font-size: 15px;
}

.brand-name {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: -0.01em;
}

.heading {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}

.intro {
  margin: 0 0 22px;
  color: var(--muted);
  line-height: 1.5;
}

.continue {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  margin-bottom: 14px;
  padding: 0 16px;
  border-radius: 11px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 15px;
  text-decoration: none;
}

.continue:hover {
  background: var(--accent-hover);
}

.continue .mdi {
  font-size: 20px;
  line-height: 1;
}

.search {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border-radius: 11px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--muted);
}

.search:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.search .mdi {
  font-size: 20px;
  line-height: 1;
}

.search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-family: inherit;
  font-size: 15px;
}

.hint {
  margin: 14px 2px 0;
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.45;
}

.results {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 11px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  text-decoration: none;
}

.result:hover,
.result:focus-visible {
  border-color: var(--accent-border);
  background: var(--accent-soft);
}

.result-name {
  font-weight: 600;
  font-size: 14.5px;
}

.result-address {
  font-size: 12px;
  color: var(--faint);
}

.footer {
  margin: 32px 2px 0;
  font-size: 12.5px;
  color: var(--faint);
}
</style>

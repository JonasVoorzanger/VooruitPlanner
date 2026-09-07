<template>
  <v-container class="py-8">
    <div class="page-shell d-flex flex-column ga-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Kies je vak</h1>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Klik op je vak om de planning te bekijken en aan te passen. Je wijzigingen worden niet online opgeslagen:
          je downloadt ze aan het eind als CSV-bestand.
        </p>
      </div>

      <div class="d-flex flex-wrap ga-4 align-center">
        <v-text-field
          v-model="search"
          density="comfortable"
          variant="outlined"
          hide-details
          clearable
          placeholder="Zoek op vak of afkorting"
          prepend-inner-icon="mdi-magnify"
          class="search"
        />

        <v-btn-toggle v-model="yearFilter" color="primary" density="comfortable" mandatory rounded="lg">
          <v-btn value="all">Alle</v-btn>
          <v-btn v-for="year in years" :key="year" :value="year">Klas {{ year }}</v-btn>
        </v-btn-toggle>
      </div>

      <div v-if="rows.length" class="subject-grid">
        <v-card
          v-for="row in rows"
          :key="row.key"
          class="subject-card"
          rounded="xl"
          elevation="0"
          border
          :to="`/bewerk/${row.year}/${row.abbr}`"
        >
          <v-card-text class="d-flex align-center ga-4">
            <div class="abbr">{{ row.abbr }}</div>

            <div class="grow">
              <div class="text-subtitle-1 font-weight-bold">{{ row.name }}</div>
              <div class="text-caption text-medium-emphasis">
                Klas {{ row.year }} · {{ row.itemCount }} items ·
                {{ row.testCount }} {{ row.testCount === 1 ? 'toets' : 'toetsen' }}
              </div>
            </div>

            <v-icon class="text-medium-emphasis">mdi-chevron-right</v-icon>
          </v-card-text>
        </v-card>
      </div>

      <v-alert v-else type="info" variant="tonal" density="comfortable">
        Geen vakken gevonden voor deze zoekopdracht.
      </v-alert>
    </div>
  </v-container>
</template>

<script>
import { useSpreadsheetStore } from '../stores/spreadsheet'
import { availableYears, parseDate, subjectYearRows } from '../utils/plannerModel'

export default {
  name: 'EditIndexView',
  data() {
    return {
      spreadsheetStore: useSpreadsheetStore(),
      search: '',
      yearFilter: 'all',
    }
  },
  computed: {
    events() {
      return this.spreadsheetStore.events
    },
    weeks() {
      return [...this.spreadsheetStore.weeks].sort((a, b) => {
        const startA = parseDate(a.start_date)
        const startB = parseDate(b.start_date)
        return (startA ? startA.getTime() : 0) - (startB ? startB.getTime() : 0)
      })
    },
    years() {
      return availableYears(this.events)
    },
    allRows() {
      return subjectYearRows(this.events, this.weeks, this.spreadsheetStore.subjects)
    },
    rows() {
      const term = String(this.search || '').trim().toLowerCase()

      return this.allRows.filter((row) => {
        if (this.yearFilter !== 'all' && row.year !== this.yearFilter) {
          return false
        }
        if (!term) {
          return true
        }
        return `${row.abbr} ${row.name}`.toLowerCase().includes(term)
      })
    },
  },
}
</script>

<style scoped>
.search {
  flex: 1 1 320px;
  min-width: 0;
}

.subject-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.subject-card {
  transition: border-color 0.12s, box-shadow 0.12s;
}

.subject-card:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 3px 10px rgba(0, 0, 0, 0.1);
}

.abbr {
  flex: 0 0 auto;
  min-width: 52px;
  padding: 6px 10px;
  border-radius: 9px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
}

.grow {
  flex: 1;
  min-width: 0;
}
</style>

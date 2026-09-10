<template>
  <div>
    <v-container class="py-6 pp-screen-only">
      <div class="page-shell d-flex flex-column ga-6">
        <div>
          <h1 class="text-h4 font-weight-bold mb-2">Bulkexport per vak</h1>
          <p class="text-body-1 text-medium-emphasis">
            Exporteer de planning van één vak, of van alle vakken achter elkaar, om ter controle naar de docenten te
            sturen. Elk vak krijgt dezelfde opmaak als de “Per vak”-weergave in de planner.
          </p>
        </div>

        <v-card rounded="xl">
          <v-card-text class="d-flex flex-column ga-4">
            <div class="d-flex flex-wrap ga-4 align-center">
              <v-btn-toggle v-model="yearFilter" color="primary" density="comfortable" mandatory rounded="lg">
                <v-btn value="all">Alle leerjaren</v-btn>
                <v-btn v-for="year in years" :key="year" :value="year">Klas {{ year }}</v-btn>
              </v-btn-toggle>

              <v-checkbox
                v-model="includeEmptyWeeks"
                density="compact"
                hide-details
                label="Lege weken als streepje tonen"
              />
            </div>

            <v-alert type="info" variant="tonal" density="comfortable">
              Bestandsnaam per vak: <strong>{{ nameExample }}</strong
              >. Kies in het printvenster “Opslaan als pdf”. Bij “Alles achter elkaar” begint ieder vak op een nieuwe
              pagina in één document.
            </v-alert>

            <div class="d-flex flex-wrap ga-3">
              <v-btn
                color="primary"
                :disabled="!rows.length"
                prepend-icon="mdi-file-document-multiple-outline"
                @click="exportAll"
              >
                Alles achter elkaar ({{ rows.length }})
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <v-card rounded="xl">
          <v-table>
            <thead>
              <tr>
                <th>Vak</th>
                <th>Klas</th>
                <th class="text-right">Items</th>
                <th class="text-right">Toetsen</th>
                <th class="text-right">Weken met items</th>
                <th class="text-right">Export</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.key">
                <td>
                  <span class="font-weight-bold">{{ row.abbr }}</span>
                  <span class="text-medium-emphasis"> · {{ row.name }}</span>
                </td>
                <td>{{ row.year }}</td>
                <td class="text-right">{{ row.itemCount }}</td>
                <td class="text-right">{{ row.testCount }}</td>
                <td class="text-right">{{ row.weekCount }}</td>
                <td class="text-right">
                  <div class="d-inline-flex ga-2">
                    <v-btn
                      size="small"
                      variant="text"
                      prepend-icon="mdi-pencil-outline"
                      :to="`/bewerk/${row.year}/${row.abbr}`"
                    >
                      Bewerk
                    </v-btn>
                    <v-btn size="small" variant="tonal" prepend-icon="mdi-printer-outline" @click="exportOne(row)">
                      Exporteer
                    </v-btn>
                  </div>
                </td>
              </tr>
              <tr v-if="!rows.length">
                <td colspan="6" class="text-medium-emphasis py-6 text-center">
                  Geen vakken met items gevonden. Laad eerst de spreadsheet in met <code>npm run load-data</code>.
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </div>
    </v-container>

    <!-- Buiten de Vuetify-shell, zodat alleen dit op papier belandt. -->
    <Teleport to="body">
      <div v-if="printTargets.length" class="pp-print-root">
        <div v-for="target in printTargets" :key="target.key" class="bulk-section">
          <PrintDocument
            :weeks="printWeeks(target)"
            :events="events"
            :subjects-map="subjectsMap"
            :year="target.year"
            :courses="[target.abbr]"
            :course="target.abbr"
            view="subject"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import PrintDocument from '../components/planner/PrintDocument.vue'
import { useSpreadsheetStore } from '../stores/spreadsheet'
import {
  availableYears,
  formatNumericDate,
  parseDate,
  subjectEventsInWeek,
  subjectExportName,
  subjectYearRows,
} from '../utils/plannerModel'
import { captureEvent } from '../utils/analytics'
import { printAfterRender } from '../utils/print'

export default {
  name: 'BulkExportView',
  components: {
    PrintDocument,
  },
  data() {
    return {
      spreadsheetStore: useSpreadsheetStore(),
      yearFilter: 'all',
      includeEmptyWeeks: true,
      printTargets: [],
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
    subjectsMap() {
      return this.spreadsheetStore.subjects.reduce((map, subject) => {
        map[subject.abbreviation] = subject.full_name
        return map
      }, {})
    },
    // Alle leerjaren die daadwerkelijk in de events voorkomen.
    years() {
      return availableYears(this.events)
    },
    allRows() {
      return subjectYearRows(this.events, this.weeks, this.spreadsheetStore.subjects)
    },
    rows() {
      if (this.yearFilter === 'all') {
        return this.allRows
      }
      return this.allRows.filter((row) => row.year === this.yearFilter)
    },
    nameExample() {
      const first = this.rows[0]
      if (!first) {
        return 'Planner <vak> klas <leerjaar> <begindatum>-<einddatum>'
      }
      const bounds = this.weekBounds(this.printWeeks(first))
      return subjectExportName(first.abbr, first.year, bounds.start, bounds.end)
    },
  },
  methods: {
    // Zonder lege weken blijven alleen de weken over waarin het vak iets heeft.
    printWeeks(target) {
      if (this.includeEmptyWeeks) {
        return this.weeks
      }
      return this.weeks.filter(
        (week) => subjectEventsInWeek(this.events, week, target.year, [target.abbr]).length > 0,
      )
    },
    weekBounds(weeks) {
      const dates = weeks
        .flatMap((week) => [parseDate(week.start_date), parseDate(week.end_date)])
        .filter(Boolean)

      if (!dates.length) {
        return { start: null, end: null }
      }

      return {
        start: new Date(Math.min(...dates.map((date) => date.getTime()))),
        end: new Date(Math.max(...dates.map((date) => date.getTime()))),
      }
    },
    exportOne(row) {
      const bounds = this.weekBounds(this.printWeeks(row))
      this.printTargets = [row]
      captureEvent('bulk_planner_exported', {
        export_scope: 'single_subject',
        year_filter: String(row.year),
        target_count: 1,
        include_empty_weeks: this.includeEmptyWeeks,
      })
      printAfterRender(this, 'portrait', subjectExportName(row.abbr, row.year, bounds.start, bounds.end))
    },
    exportAll() {
      if (!this.rows.length) {
        return
      }

      this.printTargets = [...this.rows]
      captureEvent('bulk_planner_exported', {
        export_scope: 'all_subjects',
        year_filter: String(this.yearFilter),
        target_count: this.rows.length,
        include_empty_weeks: this.includeEmptyWeeks,
      })

      const bounds = this.weekBounds(this.weeks)
      const scope =
        this.yearFilter === 'all' ? 'Planner alle vakken' : `Planner alle vakken klas ${this.yearFilter}`
      const range =
        bounds.start && bounds.end
          ? ` ${formatNumericDate(bounds.start)}-${formatNumericDate(bounds.end)}`
          : ''
      printAfterRender(this, 'portrait', `${scope}${range}`)
    },
  },
}
</script>

<style scoped>
.bulk-section + .bulk-section {
  break-before: page;
  page-break-before: always;
}
</style>

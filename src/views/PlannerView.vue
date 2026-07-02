<template>
  <v-container class="py-6">
    <div class="page-shell d-flex flex-column ga-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">PeriodePlanner</h1>
        <p class="text-body-1 text-medium-emphasis">
          Filter op leerjaar, week en vak. De huidige selectie wordt in de URL opgeslagen zodat je de planner kunt delen.
        </p>
      </div>

      <v-card rounded="xl">
        <v-card-text class="d-flex flex-column ga-6">
          <v-row>
            <v-col cols="12" md="4">
              <v-autocomplete
                v-model="selectedYears"
                :items="yearOptions"
                chips
                closable-chips
                clearable
                item-title="title"
                item-value="value"
                label="Leerjaren"
                multiple
                prepend-inner-icon="mdi-account-group-outline"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-btn-toggle v-model="weekMode" color="primary" divided mandatory>
                <v-btn value="range">Weekbereik</v-btn>
                <v-btn value="specific">Specifieke weken</v-btn>
              </v-btn-toggle>

              <div v-if="weekMode === 'range'" class="mt-4 d-flex flex-column ga-4">
                <v-select
                  v-model="rangeStart"
                  :items="weekNumberOptions"
                  clearable
                  label="Van week"
                  prepend-inner-icon="mdi-arrow-expand-horizontal"
                />
                <v-select
                  v-model="rangeEnd"
                  :items="weekNumberOptions"
                  clearable
                  label="Tot week"
                  prepend-inner-icon="mdi-arrow-expand-horizontal"
                />
              </div>

              <v-select
                v-else
                v-model="selectedWeeks"
                class="mt-4"
                :items="weekNumberOptions"
                chips
                closable-chips
                clearable
                label="Specifieke weken"
                multiple
                prepend-inner-icon="mdi-calendar-range"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-autocomplete
                v-model="selectedSubjects"
                :items="subjectOptions"
                chips
                closable-chips
                clearable
                item-title="label"
                item-value="value"
                label="Vakken"
                multiple
                prepend-inner-icon="mdi-book-multiple-outline"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.raw.value" :subtitle="item.raw.label" />
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>

          <div class="d-flex flex-wrap align-center ga-3">
            <v-btn variant="text" prepend-icon="mdi-filter-off-outline" @click="resetFilters">Filters resetten</v-btn>
            <PdfExportButton @error="setPdfError" />
            <v-spacer />
            <v-chip color="primary" variant="tonal">{{ filteredWeeks.length }} weken zichtbaar</v-chip>
          </div>
        </v-card-text>
      </v-card>

      <v-alert v-if="pdfError" type="error" variant="tonal">{{ pdfError }}</v-alert>

      <div id="planner-content" class="d-flex flex-column ga-6">
        <template v-if="filteredWeeks.length">
          <WeekCard
            v-for="week in filteredWeeks"
            :key="week.week_number"
            :week="week"
            :events="spreadsheetStore.getEventsByWeek(week, selectedYears)"
            :subject-items="spreadsheetStore.getSubjectItemsByWeekAndYear(week.week_number, selectedYears, selectedSubjects)"
            :subjects-map="subjectsMap"
            :selected-subjects="selectedSubjects"
          />
        </template>

        <v-alert v-else type="info" variant="tonal">
          Geen weken gevonden. Pas de filters aan.
        </v-alert>
      </div>
    </div>
  </v-container>
</template>

<script>
import PdfExportButton from '../components/PdfExportButton.vue'
import WeekCard from '../components/WeekCard.vue'
import { useSpreadsheetStore } from '../stores/spreadsheet'

function areSameValues(left, right) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort())
}

export default {
  name: 'PlannerView',
  components: {
    PdfExportButton,
    WeekCard,
  },
  data() {
    return {
      spreadsheetStore: useSpreadsheetStore(),
      selectedYears: [1, 2, 3, 4, 5, 6],
      selectedWeeks: [],
      selectedSubjects: [],
      weekMode: 'range',
      rangeStart: null,
      rangeEnd: null,
      syncingRoute: false,
      pdfError: '',
    }
  },
  computed: {
    yearOptions() {
      return [1, 2, 3, 4, 5, 6].map((year) => ({
        title: `Leerjaar ${year}`,
        value: year,
      }))
    },
    weekNumberOptions() {
      return this.spreadsheetStore.weeks.map((week) => week.week_number)
    },
    subjectOptions() {
      return this.spreadsheetStore.subjects.map((subject) => ({
        label: subject.full_name,
        value: subject.abbreviation,
      }))
    },
    subjectsMap() {
      return this.spreadsheetStore.subjects.reduce((map, subject) => {
        map[subject.abbreviation] = subject.full_name
        return map
      }, {})
    },
    allWeekNumbers() {
      return this.spreadsheetStore.weeks.map((week) => week.week_number)
    },
    filteredWeeks() {
      if (!this.selectedWeeks.length) {
        return this.spreadsheetStore.weeks
      }

      const selectedSet = new Set(this.selectedWeeks)
      return this.spreadsheetStore.weeks.filter((week) => selectedSet.has(week.week_number))
    },
  },
  watch: {
    '$route.query': {
      handler(query) {
        this.applyRouteFilters(query)
      },
      deep: true,
    },
    selectedYears: {
      handler() {
        this.syncRouteFilters()
      },
      deep: true,
    },
    selectedWeeks: {
      handler(newValue) {
        this.syncRangeFromSelectedWeeks(newValue)
        this.syncRouteFilters()
      },
      deep: true,
    },
    selectedSubjects: {
      handler() {
        this.syncRouteFilters()
      },
      deep: true,
    },
    weekMode() {
      if (this.weekMode === 'range') {
        this.applyRangeSelection()
      }
    },
    rangeStart() {
      this.applyRangeSelection()
    },
    rangeEnd() {
      this.applyRangeSelection()
    },
  },
  mounted() {
    this.applyRouteFilters(this.$route.query)
    this.initializeWeeks()
  },
  methods: {
    parseNumberQuery(value) {
      if (!value) {
        return []
      }

      return String(value)
        .split(',')
        .map((item) => Number(item))
        .filter((item) => !Number.isNaN(item))
    },
    parseTextQuery(value) {
      if (!value) {
        return []
      }

      return String(value)
        .split(',')
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)
    },
    applyRouteFilters(query) {
      this.syncingRoute = true

      const defaultYears = [1, 2, 3, 4, 5, 6]
      const yearValues = query.year ? this.parseNumberQuery(query.year) : defaultYears
      const weekValues = query.weeks ? this.parseNumberQuery(query.weeks) : []
      const subjectValues = query.subjects ? this.parseTextQuery(query.subjects) : []

      this.selectedYears = yearValues.length ? yearValues : defaultYears
      this.selectedWeeks = weekValues
      this.selectedSubjects = subjectValues
      this.weekMode = this.isContiguous(weekValues) ? 'range' : 'specific'
      this.syncRangeFromSelectedWeeks(weekValues)

      this.$nextTick(() => {
        this.syncingRoute = false
      })
    },
    syncRouteFilters() {
      if (this.syncingRoute) {
        return
      }

      const query = {}
      const normalizedYears = [...this.selectedYears].sort((a, b) => a - b)
      const normalizedWeeks = [...this.selectedWeeks].sort((a, b) => a - b)
      const normalizedSubjects = [...this.selectedSubjects].sort()

      if (!areSameValues(normalizedYears, [1, 2, 3, 4, 5, 6])) {
        query.year = normalizedYears.join(',')
      }

      if (!areSameValues(normalizedWeeks, this.allWeekNumbers)) {
        query.weeks = normalizedWeeks.join(',')
      }

      if (normalizedSubjects.length) {
        query.subjects = normalizedSubjects.join(',')
      }

      const currentQuery = {
        year: this.$route.query.year || undefined,
        weeks: this.$route.query.weeks || undefined,
        subjects: this.$route.query.subjects || undefined,
      }

      const nextQuery = {
        year: query.year || undefined,
        weeks: query.weeks || undefined,
        subjects: query.subjects || undefined,
      }

      if (JSON.stringify(currentQuery) !== JSON.stringify(nextQuery)) {
        this.$router.replace({ query })
      }
    },
    isContiguous(weekValues) {
      if (!weekValues.length) {
        return true
      }

      const sortedWeeks = [...weekValues].sort((a, b) => a - b)
      return sortedWeeks.every((week, index) => index === 0 || week - sortedWeeks[index - 1] === 1)
    },
    syncRangeFromSelectedWeeks(weekValues) {
      const sortedWeeks = [...weekValues].sort((a, b) => a - b)

      if (!sortedWeeks.length) {
        this.rangeStart = this.allWeekNumbers[0] || null
        this.rangeEnd = this.allWeekNumbers[this.allWeekNumbers.length - 1] || null
        return
      }

      this.rangeStart = sortedWeeks[0]
      this.rangeEnd = sortedWeeks[sortedWeeks.length - 1]
    },
    applyRangeSelection() {
      if (this.weekMode !== 'range' || this.syncingRoute || !this.allWeekNumbers.length) {
        return
      }

      const start = this.rangeStart || this.allWeekNumbers[0]
      const end = this.rangeEnd || this.allWeekNumbers[this.allWeekNumbers.length - 1]
      const min = Math.min(start, end)
      const max = Math.max(start, end)
      this.selectedWeeks = this.allWeekNumbers.filter((week) => week >= min && week <= max)
    },
    initializeWeeks() {
      if (!this.$route.query.weeks) {
        this.selectedWeeks = [...this.allWeekNumbers]
      } else {
        this.selectedWeeks = this.selectedWeeks.filter((week) => this.allWeekNumbers.includes(week))
      }

      this.syncRangeFromSelectedWeeks(this.selectedWeeks)
    },
    resetFilters() {
      this.selectedYears = [1, 2, 3, 4, 5, 6]
      this.selectedWeeks = [...this.allWeekNumbers]
      this.selectedSubjects = []
      this.weekMode = 'range'
      this.syncRangeFromSelectedWeeks(this.selectedWeeks)
    },
    setPdfError(message) {
      this.pdfError = message
    },
  },
}
</script>

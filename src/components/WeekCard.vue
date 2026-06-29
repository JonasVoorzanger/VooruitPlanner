<template>
  <v-card class="mb-6" rounded="xl" variant="elevated">
    <v-card-item>
      <template #prepend>
        <v-avatar color="primary" size="48" rounded="lg">
          <span class="text-h6 font-weight-bold text-white">{{ week.week_number }}</span>
        </v-avatar>
      </template>
      <v-card-title>Week {{ week.week_number }}</v-card-title>
      <v-card-subtitle>{{ formattedDateRange }}</v-card-subtitle>
      <template v-if="week.label" #append>
        <v-chip color="secondary" variant="tonal">{{ week.label }}</v-chip>
      </template>
    </v-card-item>

    <v-divider />

    <v-card-text class="d-flex flex-column ga-6">
      <section>
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon color="info">mdi-bullhorn-outline</v-icon>
          <h3 class="text-subtitle-1 font-weight-bold">Schoolbrede events</h3>
        </div>
        <div v-if="events.length" class="d-flex flex-column ga-3">
          <EventItem v-for="event in events" :key="`${event.date}-${event.description}`" :event="event" />
        </div>
        <v-alert v-else density="comfortable" type="info" variant="tonal">
          Geen schoolbrede events voor deze selectie.
        </v-alert>
      </section>

      <section>
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon color="primary">mdi-book-open-page-variant-outline</v-icon>
          <h3 class="text-subtitle-1 font-weight-bold">Vakkenoverzicht</h3>
        </div>

        <div v-if="subjectSections.length" class="d-flex flex-column ga-5">
          <v-sheet
            v-for="section in subjectSections"
            :key="section.abbreviation"
            border
            color="grey-lighten-5"
            rounded="lg"
            class="pa-4"
          >
            <div class="d-flex flex-wrap align-center ga-2 mb-4">
              <SubjectChip :abbreviation="section.abbreviation" :full-name="section.fullName" />
              <span class="text-body-2 text-medium-emphasis">{{ section.fullName || 'Vak zonder volledige naam' }}</span>
            </div>

            <div v-if="section.tests.length" class="mb-4">
              <div class="text-subtitle-2 font-weight-bold mb-2">Toetsen & beoordelingen</div>
              <TestItem
                v-for="testItem in section.tests"
                :key="`${section.abbreviation}-${testItem.year}-${testItem.label}-${testItem.type}`"
                :test-item="testItem"
                :subject-name="section.fullName"
              />
            </div>

            <div v-if="section.descriptions.length">
              <div class="text-subtitle-2 font-weight-bold mb-2">Weekbeschrijvingen</div>
              <WeekDescription
                v-for="description in section.descriptions"
                :key="`${section.abbreviation}-${description.year}-${description.week_number}`"
                :description="description"
                :subject-name="section.fullName"
              />
            </div>
          </v-sheet>
        </div>

        <v-alert v-else density="comfortable" type="warning" variant="tonal">
          Geen vakinformatie gevonden voor deze week en filterselectie.
        </v-alert>
      </section>
    </v-card-text>
  </v-card>
</template>

<script>
import EventItem from './EventItem.vue'
import SubjectChip from './SubjectChip.vue'
import TestItem from './TestItem.vue'
import WeekDescription from './WeekDescription.vue'

export default {
  name: 'WeekCard',
  components: {
    EventItem,
    SubjectChip,
    TestItem,
    WeekDescription,
  },
  props: {
    week: {
      type: Object,
      required: true,
    },
    events: {
      type: Array,
      default: () => [],
    },
    tests: {
      type: Array,
      default: () => [],
    },
    descriptions: {
      type: Array,
      default: () => [],
    },
    subjectsMap: {
      type: Object,
      default: () => ({}),
    },
    selectedSubjects: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    formattedDateRange() {
      const formatter = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: 'short' })
      const startDate = new Date(`${this.week.start_date}T12:00:00`)
      const endDate = new Date(`${this.week.end_date}T12:00:00`)

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return `${this.week.start_date} – ${this.week.end_date}`
      }

      return `${formatter.format(startDate)} – ${formatter.format(endDate)}`
    },
    subjectSections() {
      const sourceSubjects = new Set([
        ...this.tests.map((item) => item.subject_abbreviation),
        ...this.descriptions.map((item) => item.subject_abbreviation),
      ])
      const orderedSubjects = this.selectedSubjects.length
        ? this.selectedSubjects.filter((subject) => sourceSubjects.has(subject))
        : Array.from(sourceSubjects).sort((a, b) => a.localeCompare(b))

      return orderedSubjects
        .map((abbreviation) => ({
          abbreviation,
          fullName: this.subjectsMap[abbreviation] || '',
          tests: this.tests.filter((item) => item.subject_abbreviation === abbreviation),
          descriptions: this.descriptions.filter((item) => item.subject_abbreviation === abbreviation),
        }))
        .filter((section) => section.tests.length || section.descriptions.length)
    },
  },
}
</script>

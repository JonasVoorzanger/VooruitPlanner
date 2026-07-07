<template>
  <v-card rounded="xl">
    <v-card-text class="py-3 px-4">
      <div class="d-flex flex-wrap align-center ga-3">
        <v-avatar color="primary" size="40" rounded="lg" class="flex-shrink-0">
          <span class="text-subtitle-2 font-weight-bold text-white">{{ week.week_number }}</span>
        </v-avatar>

        <div class="flex-shrink-0" style="min-width: 130px">
          <div class="text-body-2 font-weight-medium">Week {{ week.week_number }}</div>
          <div class="text-caption text-medium-emphasis">{{ formattedDateRange }}</div>
        </div>

        <v-chip v-if="week.label" color="secondary" size="small" variant="tonal">{{ week.label }}</v-chip>

        <template v-if="events.length">
          <v-divider vertical class="mx-1 align-self-center" style="height: 24px" />
          <v-chip
            v-for="event in events"
            :key="`ev-${event.label}-${event.date}`"
            color="info"
            size="small"
            variant="tonal"
            prepend-icon="mdi-bullhorn-outline"
          >{{ event.label || formattedEventDate(event) }}</v-chip>
        </template>

        <template v-if="testChips.length">
          <v-divider vertical class="mx-1 align-self-center" style="height: 24px" />
          <v-chip
            v-for="(chip, idx) in testChips"
            :key="idx"
            :color="chip.color"
            size="small"
            variant="tonal"
            :prepend-icon="chip.icon"
          >{{ chip.text }}</v-chip>
        </template>

        <v-chip
          v-if="detailLevel === 'full' && planItemCount > 0"
          size="small"
          variant="text"
          color="grey"
          prepend-icon="mdi-calendar-check-outline"
        >{{ planItemCount }} activiteit{{ planItemCount === 1 ? '' : 'en' }}</v-chip>

        <v-chip
          v-if="!testChips.length && !events.length && !week.label"
          size="small"
          variant="text"
          color="grey"
        >Geen items</v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
const typeConfig = {
  proefwerk: { label: 'PW', color: 'error', icon: 'mdi-file-document-outline' },
  so: { label: 'SO', color: 'warning', icon: 'mdi-clipboard-text-outline' },
  schoolexamen: { label: 'SE', color: 'deep-purple', icon: 'mdi-school-outline' },
  presentatie: { label: 'PR', color: 'success', icon: 'mdi-presentation' },
  luistertoets: { label: 'LT', color: 'info', icon: 'mdi-headphones' },
}

const TEST_TYPES = new Set(Object.keys(typeConfig))

const dateFormatter = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: 'short' })

function formatDate(value) {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

export default {
  name: 'WeekListRow',
  props: {
    week: {
      type: Object,
      required: true,
    },
    events: {
      type: Array,
      default: () => [],
    },
    subjectItems: {
      type: Array,
      default: () => [],
    },
    subjectsMap: {
      type: Object,
      default: () => ({}),
    },
    detailLevel: {
      type: String,
      default: 'full',
    },
  },
  computed: {
    formattedDateRange() {
      const startDate = new Date(`${this.week.start_date}T12:00:00`)
      const endDate = new Date(`${this.week.end_date}T12:00:00`)
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return `${this.week.start_date} – ${this.week.end_date}`
      }
      return `${dateFormatter.format(startDate)} – ${dateFormatter.format(endDate)}`
    },
    testChips() {
      return this.subjectItems
        .filter((item) => TEST_TYPES.has(String(item.type || '').trim().toLowerCase()))
        .map((item) => {
          const type = String(item.type || '').trim().toLowerCase()
          const config = typeConfig[type] || { label: 'Toets', color: 'primary', icon: 'mdi-note-text-outline' }
          const label = item.label ? `${item.subject_abbreviation}: ${item.label}` : `${item.subject_abbreviation} ${config.label}`
          return { text: label, color: config.color, icon: config.icon }
        })
    },
    planItemCount() {
      return this.subjectItems.filter(
        (item) => !TEST_TYPES.has(String(item.type || '').trim().toLowerCase()),
      ).length
    },
  },
  methods: {
    formattedEventDate(event) {
      const start = formatDate(event.date)
      const end = formatDate(event.end_date)
      if (!start) return ''
      return end && end !== start ? `${start} – ${end}` : start
    },
  },
}
</script>

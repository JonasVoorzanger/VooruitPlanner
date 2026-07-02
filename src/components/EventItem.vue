<template>
  <v-alert border="start" color="info" density="comfortable" icon="mdi-calendar-star" variant="tonal">
    <div class="font-weight-medium">{{ event.label || formattedDateRange }}</div>
    <div v-if="event.label && formattedDateRange" class="text-caption text-medium-emphasis">{{ formattedDateRange }}</div>
    <MarkdownContent v-if="event.description" :content="event.description" class="mt-1" />
  </v-alert>
</template>

<script>
import MarkdownContent from './MarkdownContent.vue'

const dateFormatter = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })

function formatDate(value) {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

export default {
  name: 'EventItem',
  components: {
    MarkdownContent,
  },
  props: {
    event: {
      type: Object,
      required: true,
    },
  },
  computed: {
    formattedDateRange() {
      const start = formatDate(this.event.date)
      const end = formatDate(this.event.end_date)
      if (!start) return ''
      return end && end !== start ? `${start} – ${end}` : start
    },
  },
}
</script>

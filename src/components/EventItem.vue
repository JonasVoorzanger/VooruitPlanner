<template>
  <v-alert border="start" color="info" density="comfortable" icon="mdi-calendar-star" variant="tonal">
    <div class="font-weight-medium">{{ formattedDate }}</div>
    <MarkdownContent :content="event.description" class="mt-1" />
  </v-alert>
</template>

<script>
import MarkdownContent from './MarkdownContent.vue'

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
    formattedDate() {
      if (!this.event.date) {
        return 'Schoolbreed event'
      }

      const date = new Date(`${this.event.date}T12:00:00`)
      return Number.isNaN(date.getTime())
        ? this.event.date
        : new Intl.DateTimeFormat('nl-NL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }).format(date)
    },
  },
}
</script>

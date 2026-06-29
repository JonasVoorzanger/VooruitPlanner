<template>
  <v-chip
    :color="chipColor"
    :size="size"
    label
    variant="tonal"
    prepend-icon="mdi-book-education-outline"
  >
    {{ abbreviation }}
    <v-tooltip v-if="fullName" activator="parent" location="top">
      {{ fullName }}
    </v-tooltip>
  </v-chip>
</template>

<script>
const palette = ['primary', 'secondary', 'success', 'info', 'warning', 'error']

export default {
  name: 'SubjectChip',
  props: {
    abbreviation: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      default: '',
    },
    size: {
      type: String,
      default: 'default',
    },
  },
  computed: {
    chipColor() {
      const hash = Array.from(this.abbreviation).reduce((total, character) => total + character.charCodeAt(0), 0)
      return palette[hash % palette.length]
    },
  },
}
</script>

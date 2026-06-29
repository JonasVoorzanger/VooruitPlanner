<template>
  <v-card class="mb-3" variant="outlined" rounded="lg">
    <v-card-text class="d-flex flex-column ga-3">
      <div class="d-flex flex-wrap align-center ga-2">
        <SubjectChip :abbreviation="testItem.subject_abbreviation" :full-name="subjectName" size="small" />
        <v-chip :color="typeMeta.color" size="small" variant="tonal" :prepend-icon="typeMeta.icon">
          {{ typeMeta.label }}
        </v-chip>
        <v-chip
          size="small"
          :color="isFormative ? 'blue-grey' : 'accent'"
          :prepend-icon="isFormative ? 'mdi-pencil-outline' : 'mdi-scale-balance'"
          variant="flat"
        >
          {{ weightLabel }}
        </v-chip>
        <v-chip size="small" variant="text">Jaar {{ testItem.year }}</v-chip>
      </div>

      <div>
        <div class="text-subtitle-1 font-weight-bold">{{ testItem.label || 'Toetsmoment' }}</div>
        <MarkdownContent v-if="testItem.description" :content="testItem.description" class="mt-2 text-medium-emphasis" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import MarkdownContent from './MarkdownContent.vue'
import SubjectChip from './SubjectChip.vue'

const typeConfig = {
  proefwerk: { label: 'Proefwerk', color: 'error', icon: 'mdi-file-document-outline' },
  so: { label: 'SO', color: 'warning', icon: 'mdi-clipboard-text-outline' },
  schoolexamen: { label: 'Schoolexamen', color: 'deep-purple', icon: 'mdi-school-outline' },
  presentatie: { label: 'Presentatie', color: 'success', icon: 'mdi-presentation' },
  luistertoets: { label: 'Luistertoets', color: 'info', icon: 'mdi-headphones' },
}

export default {
  name: 'TestItem',
  components: {
    MarkdownContent,
    SubjectChip,
  },
  props: {
    testItem: {
      type: Object,
      required: true,
    },
    subjectName: {
      type: String,
      default: '',
    },
  },
  computed: {
    normalizedType() {
      return String(this.testItem.type || '').trim().toLowerCase()
    },
    typeMeta() {
      return typeConfig[this.normalizedType] || {
        label: this.testItem.type || 'Toets',
        color: 'primary',
        icon: 'mdi-note-text-outline',
      }
    },
    isFormative() {
      return String(this.testItem.weight || '').trim().toLowerCase() === 'formatief'
    },
    weightLabel() {
      if (this.isFormative) {
        return 'Formatief'
      }

      if (!this.testItem.weight) {
        return 'Geen weging'
      }

      return `Weging ${this.testItem.weight}`
    },
  },
}
</script>

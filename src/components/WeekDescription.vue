<template>
  <v-card class="mb-3" color="grey-lighten-5" rounded="lg" variant="flat">
    <v-card-text>
      <div class="d-flex flex-wrap align-center ga-2 mb-3">
        <SubjectChip :abbreviation="description.subject_abbreviation" :full-name="subjectName" size="small" />
        <v-chip size="small" variant="text">Jaar {{ description.year }}</v-chip>
      </div>
      <MarkdownContent :content="description.description" />
    </v-card-text>
  </v-card>
</template>

<script>
import MarkdownContent from './MarkdownContent.vue'
import SubjectChip from './SubjectChip.vue'

export default {
  name: 'WeekDescription',
  components: {
    MarkdownContent,
    SubjectChip,
  },
  props: {
    description: {
      type: Object,
      required: true,
    },
    subjectName: {
      type: String,
      default: '',
    },
  },
}
</script>

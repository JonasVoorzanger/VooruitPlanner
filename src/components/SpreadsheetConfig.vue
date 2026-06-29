<template>
  <div class="d-flex flex-column ga-2">
    <v-text-field
      :model-value="localValue"
      :label="label"
      placeholder="https://docs.google.com/spreadsheets/d/..."
      prepend-inner-icon="mdi-google-spreadsheet"
      hint="Plak een publieke spreadsheet-URL of alleen de sheet ID."
      persistent-hint
      @update:model-value="updateValue"
    />
    <div class="d-flex flex-wrap align-center ga-3">
      <v-chip v-if="extractedId" color="success" size="small" variant="tonal">
        Sheet ID: {{ extractedId }}
      </v-chip>
      <span v-else class="text-body-2 text-medium-emphasis">Nog geen geldige sheet ID gevonden.</span>
      <v-spacer />
      <v-btn v-if="showSaveButton" color="primary" @click="emitSave">{{ buttonText }}</v-btn>
    </div>
  </div>
</template>

<script>
import { extractSpreadsheetId } from '../stores/settings'

export default {
  name: 'SpreadsheetConfig',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: 'Google Spreadsheet URL',
    },
    buttonText: {
      type: String,
      default: 'Opslaan',
    },
    showSaveButton: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['update:modelValue', 'save'],
  data() {
    return {
      localValue: this.modelValue,
    }
  },
  computed: {
    extractedId() {
      return extractSpreadsheetId(this.localValue)
    },
  },
  watch: {
    modelValue(newValue) {
      this.localValue = newValue
    },
  },
  methods: {
    updateValue(value) {
      this.localValue = value
      this.$emit('update:modelValue', value)
    },
    emitSave() {
      this.$emit('save', this.localValue)
    },
  },
}
</script>

<template>
  <div class="item-editor">
    <div class="item-editor-row">
      <v-select
        v-model="row.type"
        :items="typeOptions"
        label="Type"
        density="compact"
        variant="outlined"
        hide-details
        class="field-type"
      />
      <v-text-field
        v-model="row.label"
        label="Titel"
        density="compact"
        variant="outlined"
        hide-details
        class="field-label"
      />
      <v-text-field
        v-model="row.weight"
        label="Weging"
        placeholder="bv. 3 of 5%"
        density="compact"
        variant="outlined"
        hide-details
        class="field-weight"
      />
      <v-text-field
        v-if="showWeek"
        v-model="row.cal_week_number"
        label="Week"
        density="compact"
        variant="outlined"
        hide-details
        class="field-week"
      />
      <v-text-field
        v-if="showWeek"
        v-model="row.cal_year"
        label="Jaar"
        density="compact"
        variant="outlined"
        hide-details
        class="field-week"
      />
      <v-btn
        icon="mdi-delete-outline"
        variant="text"
        density="comfortable"
        title="Item verwijderen"
        @click="$emit('remove')"
      />
    </div>

    <v-textarea
      v-model="row.description"
      label="Omschrijving"
      rows="1"
      auto-grow
      density="compact"
      variant="outlined"
      hide-details
      class="mt-2"
    />
  </div>
</template>

<script>
// Eén bewerkbaar item. Muteert de doorgegeven rij rechtstreeks; de bewerkpagina
// houdt de lijst bij en bouwt daar de CSV uit op.
export default {
  name: 'ItemEditor',
  props: {
    row: {
      type: Object,
      required: true,
    },
    typeOptions: {
      type: Array,
      required: true,
    },
    showWeek: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['remove'],
}
</script>

<style scoped>
.item-editor {
  padding: 0;
}

.item-editor-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
}

.field-type {
  flex: 0 0 180px;
}

.field-label {
  flex: 1 1 260px;
  min-width: 0;
}

.field-weight {
  flex: 0 0 140px;
}

.field-week {
  flex: 0 0 110px;
}
</style>

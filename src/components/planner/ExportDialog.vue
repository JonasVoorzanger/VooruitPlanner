<template>
  <div class="backdrop" @click.self="close">
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="export-title">
      <div class="dialog-head">
        <div id="export-title" class="dialog-title">Exporteren naar A4</div>
        <button class="close" aria-label="Sluiten" @click="close">✕</button>
      </div>

      <div class="dialog-body">
        <div class="field">
          <div class="field-label">Weergave</div>
          <div class="option-row">
            <button
              v-for="option in viewOptions"
              :key="option.value"
              class="option"
              :class="{ active: view === option.value }"
              @click="view = option.value"
            >
              <span class="mdi" :class="option.icon" aria-hidden="true"></span>
              <span>{{ option.label }}</span>
            </button>
          </div>
          <div class="field-hint">{{ orientationHint }}</div>
        </div>

        <div v-if="view === 'subject'" class="field">
          <div class="field-label">Vak</div>
          <div class="option-row">
            <button
              v-for="option in courseOptions"
              :key="option.abbr"
              class="option course"
              :class="{ active: course === option.abbr }"
              :title="option.name"
              @click="course = option.abbr"
            >
              <span class="abbr pp-mono">{{ option.abbr }}</span>
              <span>{{ option.name }}</span>
            </button>
          </div>
        </div>

        <div v-else class="field">
          <div class="field-label">Detailniveau</div>
          <div class="option-row">
            <button
              v-for="option in detailOptions"
              :key="option.value"
              class="option"
              :class="{ active: detailLevel === option.value }"
              @click="detailLevel = option.value"
            >
              <span class="mdi" :class="option.icon" aria-hidden="true"></span>
              <span>{{ option.label }}</span>
            </button>
          </div>
        </div>

        <div class="field">
          <div class="field-label">Filter</div>
          <div class="checkbox-row">
            <label v-for="option in filterOptions" :key="option.value" class="checkbox-line">
              <input
                type="checkbox"
                :checked="filters[option.value]"
                @change="toggleFilter(option.value)"
              />
              <span>{{ option.label }}</span>
            </label>
          </div>
          <div class="field-hint">Overig zijn de schoolbrede activiteiten en vakanties.</div>
        </div>

        <div class="field">
          <div class="field-head">
            <div class="field-label">Weken</div>
            <div class="count pp-mono">{{ selectedWeeks.length }} van {{ weekRows.length }}</div>
          </div>

          <div class="quick-actions">
            <button class="quick" @click="selectAll">Alles</button>
            <button class="quick" @click="selectNone">Niets</button>
            <button class="quick" @click="selectUpcoming">Vanaf deze week</button>
            <button class="quick" @click="selectWithTests">Alleen weken met toetsen</button>
          </div>

          <div class="week-picker">
            <label
              v-for="week in weekRows"
              :key="week.key"
              class="week-option"
              :class="{ selected: isSelected(week.key), past: week.past }"
            >
              <input type="checkbox" :checked="isSelected(week.key)" @change="toggleWeek(week.key)" />
              <span class="week-name">{{ week.label }}</span>
              <span class="week-range pp-mono">{{ week.range }}</span>
              <span class="week-summary pp-mono">{{ week.summary }}</span>
            </label>
            <div v-if="!weekRows.length" class="week-empty">Geen weken beschikbaar.</div>
          </div>
        </div>
      </div>

      <div class="dialog-foot">
        <div class="foot-hint">Kies in het printvenster “Opslaan als pdf” voor een digitaal bestand.</div>
        <div class="foot-actions">
          <button class="btn ghost" @click="close">Annuleren</button>
          <button class="btn primary" :disabled="!selectedWeeks.length" @click="confirm">
            Exporteren
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  FILTER_CATEGORIES,
  filterEventsByCategory,
  formatWeekRange,
  isTestEvent,
  normalizeFilters,
  parseDate,
  schoolWideInWeek,
  subjectEventsInWeek,
} from '../../utils/plannerModel'

export default {
  name: 'ExportDialog',
  props: {
    weeks: {
      type: Array,
      required: true,
    },
    events: {
      type: Array,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    courses: {
      type: Array,
      required: true,
    },
    subjectsMap: {
      type: Object,
      default: () => ({}),
    },
    today: {
      type: Date,
      required: true,
    },
    initialView: {
      type: String,
      default: 'list',
    },
    initialDetailLevel: {
      type: String,
      default: 'full',
    },
    initialFilters: {
      type: Object,
      default: null,
    },
    initialCourse: {
      type: String,
      default: '',
    },
  },
  emits: ['close', 'export'],
  data() {
    return {
      view: ['month', 'subject'].includes(this.initialView) ? this.initialView : 'list',
      detailLevel: this.initialDetailLevel === 'compact' ? 'compact' : 'full',
      filters: normalizeFilters(this.initialFilters),
      course: this.courses.includes(this.initialCourse) ? this.initialCourse : this.courses[0] || '',
      selectedKeys: [],
      viewOptions: [
        { value: 'list', label: 'Lijst', icon: 'mdi-view-list' },
        { value: 'month', label: 'Maand', icon: 'mdi-calendar-month-outline' },
        { value: 'subject', label: 'Per vak', icon: 'mdi-book-open-page-variant-outline' },
      ],
      detailOptions: [
        { value: 'compact', label: 'Compact', icon: 'mdi-magnify-minus-outline' },
        { value: 'full', label: 'Uitgebreid', icon: 'mdi-magnify-plus-outline' },
      ],
      filterOptions: FILTER_CATEGORIES,
    }
  },
  computed: {
    exportEvents() {
      return filterEventsByCategory(this.events, this.filters)
    },
    courseOptions() {
      return this.courses.map((abbr) => ({ abbr, name: this.subjectsMap[abbr] || abbr }))
    },
    // In de vakweergave tellen alleen de items van het gekozen vak mee.
    effectiveCourses() {
      return this.view === 'subject' ? [this.course].filter(Boolean) : this.courses
    },
    orientationHint() {
      if (this.view === 'month') {
        return 'Maandweergave print op A4 liggend.'
      }
      if (this.view === 'subject') {
        return 'Vakweergave print op A4 staand, met alle toelichting erbij.'
      }
      return 'Lijstweergave print op A4 staand.'
    },
    weekRows() {
      return this.weeks.map((week, index) => {
        const start = parseDate(week.start_date)
        const end = parseDate(week.end_date)
        const subjectItems = subjectEventsInWeek(this.exportEvents, week, this.year, this.effectiveCourses)
        const testCount = subjectItems.filter(isTestEvent).length
        const schoolCount =
          this.view === 'subject' ? 0 : schoolWideInWeek(this.exportEvents, week, this.year).length

        const parts = []
        if (testCount) {
          parts.push(`${testCount} ${testCount === 1 ? 'toets' : 'toetsen'}`)
        }
        if (subjectItems.length - testCount > 0) {
          parts.push(`${subjectItems.length - testCount} planning`)
        }
        if (schoolCount) {
          parts.push(`${schoolCount} schoolbreed`)
        }

        return {
          key: index,
          week,
          label: week.label || `Week ${week.week_number}`,
          range: start && end ? formatWeekRange(start, end) : '',
          past: Boolean(end) && end < this.today,
          hasTests: testCount > 0,
          hasItems: subjectItems.length > 0 || schoolCount > 0,
          summary: parts.length ? parts.join(' · ') : 'leeg',
        }
      })
    },
    selectedWeeks() {
      const keys = new Set(this.selectedKeys)
      return this.weekRows.filter((row) => keys.has(row.key))
    },
  },
  created() {
    this.selectUpcoming()
  },
  mounted() {
    document.addEventListener('keydown', this.onKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    onKeydown(event) {
      if (event.key === 'Escape') {
        this.close()
      }
    },
    toggleFilter(category) {
      this.filters = { ...this.filters, [category]: !this.filters[category] }
    },
    isSelected(key) {
      return this.selectedKeys.includes(key)
    },
    toggleWeek(key) {
      this.selectedKeys = this.isSelected(key)
        ? this.selectedKeys.filter((selected) => selected !== key)
        : [...this.selectedKeys, key]
    },
    selectAll() {
      this.selectedKeys = this.weekRows.map((row) => row.key)
    },
    selectNone() {
      this.selectedKeys = []
    },
    selectUpcoming() {
      this.selectedKeys = this.weekRows
        .filter((row) => !row.past && row.hasItems)
        .map((row) => row.key)
    },
    selectWithTests() {
      this.selectedKeys = this.weekRows.filter((row) => row.hasTests).map((row) => row.key)
    },
    close() {
      this.$emit('close')
    },
    confirm() {
      if (!this.selectedWeeks.length) {
        return
      }

      this.$emit('export', {
        view: this.view,
        detailLevel: this.detailLevel,
        filters: { ...this.filters },
        course: this.course,
        weeks: this.selectedWeeks.map((row) => row.week),
      })
    },
  },
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 22, 40, 0.42);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 60;
}

.dialog {
  width: 100%;
  max-width: 560px;
  max-height: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 15px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  animation: pp-pop 0.16s ease both;
}

.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 15px 17px;
  border-bottom: 1px solid var(--border);
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.close {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
}

.close:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.dialog-body {
  padding: 16px 17px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.field-label {
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}

.field-hint {
  font-size: 12px;
  color: var(--faint);
}

.count {
  font-size: 12px;
  color: var(--faint);
}

.option-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.option {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
}

.option .mdi {
  font-size: 17px;
  line-height: 1;
}

.option:hover {
  border-color: var(--accent-border);
}

.option.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

.option.course {
  gap: 8px;
  height: 34px;
  padding: 0 12px;
  font-size: 13px;
}

.option.course .abbr {
  font-weight: 600;
  font-size: 11.5px;
}

.checkbox-row {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}

.checkbox-line {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13.5px;
  color: var(--text);
  cursor: pointer;
}

.checkbox-line input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}

.quick-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.quick {
  height: 29px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--muted);
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
}

.quick:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.week-picker {
  border: 1px solid var(--border);
  border-radius: 10px;
  max-height: 260px;
  overflow-y: auto;
}

.week-option {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 4px 10px;
  padding: 8px 11px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  font-size: 13px;
}

.week-option:last-child {
  border-bottom: none;
}

.week-option:hover {
  background: var(--surface-2);
}

.week-option.selected {
  background: var(--accent-soft);
}

.week-option.past .week-name,
.week-option.past .week-range {
  color: var(--faint);
}

.week-option input {
  width: 15px;
  height: 15px;
  accent-color: var(--accent);
  cursor: pointer;
}

.week-name {
  font-weight: 500;
}

.week-range {
  font-size: 11.5px;
  color: var(--muted);
  justify-self: end;
}

.week-summary {
  grid-column: 2 / -1;
  font-size: 11px;
  color: var(--faint);
}

.week-empty {
  padding: 16px;
  font-size: 13px;
  color: var(--faint);
}

.dialog-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 13px 17px;
  border-top: 1px solid var(--border);
}

.foot-hint {
  font-size: 11.5px;
  color: var(--faint);
  flex: 1;
  min-width: 160px;
}

.foot-actions {
  display: flex;
  gap: 8px;
}

.btn {
  height: 38px;
  padding: 0 16px;
  border-radius: 9px;
  cursor: pointer;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  border: 1px solid var(--border);
}

.btn.ghost {
  background: var(--surface);
  color: var(--muted);
}

.btn.ghost:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}

.btn.primary:disabled {
  background: var(--border-strong);
  border-color: var(--border-strong);
  color: var(--faint);
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .backdrop {
    padding: 0;
  }

  .dialog {
    max-width: none;
    height: 100%;
    border-radius: 0;
    border: none;
  }
}
</style>

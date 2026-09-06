<template>
  <div class="week-list">
    <div class="top-controls">
      <button v-if="hasPast" class="old-toggle" @click="showOld = !showOld">
        <span class="chevron">{{ showOld ? '▾' : '▸' }}</span>
        {{ showOld ? 'Verberg oude weken' : 'Toon oude weken' }}
      </button>
      <button class="old-toggle" @click="toggleAllVisibleWeeks">
        {{ allVisibleOpen ? 'Klap alle weken in' : 'Klap alle weken uit' }}
      </button>
    </div>

    <p v-if="showEmptySelectionWarning" class="selection-warning">
      <span class="mdi mdi-information-outline" aria-hidden="true"></span>
      <span>
        Geen items gevonden voor deze vakken{{ filteredOut ? ' met het huidige filter' : '' }}. De weken
        hieronder blijven staan, maar er staat nog niets van jouw vakken in.
      </span>
    </p>

    <div v-for="week in visibleWeeks" :key="`${week.start_date}-${week.week_number}`" class="week">
      <button class="week-head" :class="{ open: week.isOpen }" @click="toggle(week.index)">
        <span class="chevron">{{ week.isOpen ? '▾' : '▸' }}</span>
        <span class="week-label">{{ week.label }}</span>
        <span class="week-range pp-mono">{{ week.range }}</span>
        <span v-if="week.isCurrent" class="status-badge current">nu</span>
        <span v-else-if="week.past" class="status-badge past">al voorbij</span>
        <span class="summary pp-mono">{{ week.headerSummary }}</span>
      </button>

      <div v-if="week.isOpen" class="week-body">
        <div class="subject-col">
          <div class="col-head">Deze week · per vak</div>
          <div v-if="week.groups.length" class="subject-grid">
            <EventCard
              v-for="group in week.groups"
              :key="group.abbr"
              :group="group"
              :mode="cardMode"
              :subjects-map="subjectsMap"
              :when-label="week.label"
              @open="$emit('open', $event)"
            />
          </div>
          <div v-else class="empty">Geen vakactiviteiten deze week.</div>
        </div>
        <div class="days-col">
          <div class="col-head">Per dag · op datum</div>
          <DayRows :days="week.days" @open="openSchoolWide" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DayRows from './DayRows.vue'
import EventCard from './EventCard.vue'
import {
  buildDayRows,
  buildWeekGroups,
  formatShort,
  formatYearShort,
  parseDate,
  schoolWideInWeek,
  schoolWideWhenLabel,
  subjectEventsInWeek,
  typeMeta,
} from '../../utils/plannerModel'

export default {
  name: 'WeekList',
  components: {
    DayRows,
    EventCard,
  },
  props: {
    weeks: {
      type: Array,
      required: true,
    },
    events: {
      type: Array,
      required: true,
    },
    allEvents: {
      type: Array,
      default: () => [],
    },
    subjectsMap: {
      type: Object,
      default: () => ({}),
    },
    year: {
      type: Number,
      required: true,
    },
    courses: {
      type: Array,
      required: true,
    },
    detailLevel: {
      type: String,
      default: 'full',
    },
    today: {
      type: Date,
      required: true,
    },
    todayIndex: {
      type: Number,
      required: true,
    },
  },
  emits: ['open'],
  data() {
    return {
      openWeeks: [this.todayIndex, this.todayIndex + 1],
      showOld: false,
    }
  },
  computed: {
    cardMode() {
      return this.detailLevel === 'compact' ? 'listCompact' : 'listFull'
    },
    hasPast() {
      return this.weeks.some((week) => {
        const end = parseDate(week.end_date)
        return end && end < this.today
      })
    },
    allVisibleOpen() {
      if (!this.visibleWeeks.length) {
        return false
      }
      const openSet = new Set(this.openWeeks)
      return this.visibleWeeks.every((week) => openSet.has(week.index))
    },
    weekRows() {
      const openSet = new Set(this.openWeeks)

      return this.weeks.map((week, index) => {
        const start = parseDate(week.start_date)
        const end = parseDate(week.end_date)

        const subjectItems = subjectEventsInWeek(this.events, week, this.year, this.courses)
        const testCount = subjectItems.filter((event) => typeMeta(event.type).test).length
        const schoolCount = schoolWideInWeek(this.events, week, this.year).length

        const parts = []
        if (subjectItems.length) {
          const toetsLabel = `${testCount} ${testCount === 1 ? 'toets' : 'toetsen'}`
          const itemLabel = `${subjectItems.length} ${subjectItems.length === 1 ? 'item' : 'items'}`
          const allItemsAreTests = testCount > 0 && testCount === subjectItems.length
          parts.push(allItemsAreTests ? toetsLabel : testCount ? `${itemLabel} (incl. ${toetsLabel})` : itemLabel)
        }

        const headerParts = []
        if (subjectItems.length) {
          const toetsLabel = `${testCount} ${testCount === 1 ? 'toets' : 'toetsen'}`
          const itemLabel = `${subjectItems.length} ${subjectItems.length === 1 ? 'item' : 'items'}`
          const allItemsAreTests = testCount > 0 && testCount === subjectItems.length
          headerParts.push(allItemsAreTests ? toetsLabel : testCount ? `${itemLabel} (incl. ${toetsLabel})` : itemLabel)
        }

        if (schoolCount) {
          parts.push(`${schoolCount} ${schoolCount === 1 ? 'activiteit' : 'activiteiten'}`)
        }

        return {
          index,
          week_number: week.week_number,
          label: week.label || `Week ${week.week_number}`,
          range: `${start.getDate()} – ${formatShort(end)} '${formatYearShort(end)} (wk ${week.week_number})`,
          isCurrent: this.today >= start && this.today <= end,
          isOpen: openSet.has(index),
          past: end < this.today,
          hasSubjectItems: subjectItems.length > 0,
          days: buildDayRows(this.events, start, this.year, this.today),
          groups: buildWeekGroups(this.events, week, this.year, this.courses),
          headerSummary: headerParts.length ? headerParts.join(' · ') : 'geen items',
          summary: parts.length ? parts.join(' · ') : 'geen items',
        }
      })
    },
    visibleWeeks() {
      // Lege weken blijven staan: dat zijn meestal vakanties, en juist die zijn
      // nuttig om te zien bij het plannen.
      return this.weekRows.filter((week) => this.showOld || !week.past)
    },
    showEmptySelectionWarning() {
      return this.visibleWeeks.length > 0 && this.visibleWeeks.every((week) => !week.hasSubjectItems)
    },
    // Onderscheidt "dit vakkenpakket heeft niets" van "het filter verbergt alles".
    filteredOut() {
      return this.weeks.some(
        (week) => subjectEventsInWeek(this.allEvents, week, this.year, this.courses).length > 0,
      )
    },
  },
  methods: {
    toggle(index) {
      const openSet = new Set(this.openWeeks)
      if (openSet.has(index)) {
        openSet.delete(index)
      } else {
        openSet.add(index)
      }
      this.openWeeks = [...openSet]
    },
    toggleAllVisibleWeeks() {
      if (this.allVisibleOpen) {
        this.openWeeks = this.openWeeks.filter((openIndex) => !this.visibleWeeks.some((week) => week.index === openIndex))
        return
      }

      const allVisibleIndexes = this.visibleWeeks.map((week) => week.index)
      this.openWeeks = [...new Set([...this.openWeeks, ...allVisibleIndexes])]
    },
    openSchoolWide(event) {
      this.$emit('open', { event, whenLabel: schoolWideWhenLabel(event) })
    },
  },
}
</script>

<style scoped>
.week-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.selection-warning {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 0;
  padding: 11px 13px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--surface-2);
  color: var(--muted);
  font-size: 13px;
  line-height: 1.45;
}

.selection-warning .mdi {
  font-size: 17px;
  line-height: 1.2;
  flex-shrink: 0;
}

.top-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.old-toggle {
  height: 32px;
  padding: 0 13px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--muted);
  cursor: pointer;
  font-size: 12.5px;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
}

.old-toggle:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.old-toggle .chevron {
  font-size: 11px;
}

.week-head {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  text-align: left;
  padding: 13px 15px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 13px;
  cursor: pointer;
  font-family: inherit;
  color: var(--text);
  transition: border-color 0.12s;
}

.week-head:hover {
  border-color: var(--accent-border);
}

.week-head.open {
  border-radius: 13px 13px 0 0;
}

.week-head .chevron {
  color: var(--faint);
  font-size: 12px;
  width: 14px;
  flex-shrink: 0;
}

.week-label {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.week-range {
  font-size: 12.5px;
  color: var(--muted);
}

.status-badge {
  font-size: 10.5px;
  font-weight: 600;
  border-radius: 6px;
  padding: 2px 7px;
}

.status-badge.current {
  color: var(--on-accent);
  background: var(--accent);
}

.status-badge.past {
  color: var(--muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
}

.summary {
  margin-left: auto;
  font-size: 12px;
  color: var(--faint);
}

.week-body {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  background: var(--surface);
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 13px 13px;
  overflow: hidden;
}

.subject-col {
  border-right: 1px solid var(--border);
}

.days-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.days-col .day-rows {
  flex: 1;
}

.col-head {
  padding: 9px 14px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.subject-grid {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  align-items: start;
}

.empty {
  color: var(--faint);
  font-size: 13px;
  padding: 20px 14px;
}

@media (max-width: 760px) {
  .week-body {
    grid-template-columns: 1fr;
  }

  .subject-col {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .week-head {
    display: grid;
    grid-template-columns: 16px 1fr auto;
    grid-template-areas:
      'chevron label badge'
      '. range range'
      '. summary summary';
    row-gap: 4px;
    column-gap: 8px;
    align-items: start;
  }

  .week-head .chevron {
    grid-area: chevron;
    margin-top: 2px;
  }

  .week-label {
    grid-area: label;
    font-size: 15px;
  }

  .week-range {
    grid-area: range;
    font-size: 12px;
  }

  .status-badge {
    grid-area: badge;
    justify-self: end;
  }

  .summary {
    grid-area: summary;
    display: block;
    margin-left: 0;
    font-size: 11.5px;
    color: var(--muted);
  }

  .week-head.open .summary {
    display: none;
  }
}
</style>

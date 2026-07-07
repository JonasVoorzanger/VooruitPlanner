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
        <div class="day-col">
          <div class="col-head">Per dag · op datum</div>
          <div v-if="week.hasDayItems" class="day-rows">
            <div v-for="day in week.days" :key="day.label" class="day-row" :class="{ today: day.isToday }">
              <span class="day-label pp-mono" :class="{ today: day.isToday }">{{ day.label }}</span>
              <div class="day-events">
                <div
                  v-for="(event, index) in day.events"
                  :key="index"
                  class="day-event"
                  @click="openSchoolWide(event)"
                >
                  {{ event.label }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="day-empty">geen items</div>
        </div>
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
      </div>
    </div>
  </div>
</template>

<script>
import EventCard from './EventCard.vue'
import {
  addDays,
  buildWeekGroups,
  formatShort,
  formatYearShort,
  parseDate,
  sameDay,
  schoolWideInWeek,
  schoolWideOnDate,
  schoolWideWhenLabel,
  subjectEventsInWeek,
  typeMeta,
  WEEKDAYS,
} from '../../utils/plannerModel'

export default {
  name: 'WeekList',
  components: {
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

        const days = WEEKDAYS.map((weekday, dayIndex) => {
          const date = addDays(start, dayIndex)
          return {
            label: `${weekday} ${date.getDate()}`,
            isToday: sameDay(date, this.today),
            events: schoolWideOnDate(this.events, date, this.year),
          }
        })
        const hasDayItems = days.some((day) => day.events.length > 0)

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
          hasItems: subjectItems.length > 0 || schoolCount > 0,
          hasDayItems,
          days,
          groups: buildWeekGroups(this.events, week, this.year, this.courses),
          headerSummary: headerParts.length ? headerParts.join(' · ') : 'geen items',
          summary: parts.length ? parts.join(' · ') : 'geen items',
        }
      })
    },
    visibleWeeks() {
      return this.weekRows.filter((week) => {
        if (!week.hasItems) {
          return false
        }
        if (!this.showOld && week.past) {
          return false
        }
        return true
      })
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
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
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
  box-shadow: var(--shadow);
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
  grid-template-columns: minmax(240px, 0.95fr) 1.15fr;
  background: var(--surface);
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 13px 13px;
  overflow: hidden;
}

.day-col {
  border-right: 1px solid var(--border);
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

.day-rows {
  display: flex;
  flex-direction: column;
}

.day-empty {
  padding: 16px 14px;
  font-size: 12.5px;
  color: var(--faint);
}

.day-row {
  display: flex;
  gap: 12px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border);
  align-items: flex-start;
}

.day-row:last-child {
  border-bottom: none;
}

.day-row.today {
  background: var(--accent-soft);
}

.day-label {
  font-size: 12px;
  color: var(--muted);
  min-width: 44px;
  flex-shrink: 0;
}

.day-label.today {
  color: var(--accent);
  font-weight: 600;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 0;
}

.day-event {
  font-size: 12.5px;
  color: var(--text);
  cursor: pointer;
  line-height: 1.3;
}

.day-event:hover {
  color: var(--accent);
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

  .day-col {
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

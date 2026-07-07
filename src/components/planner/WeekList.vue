<template>
  <div class="week-list">
    <div class="top-controls">
      <button v-if="hasPast" class="old-toggle" @click="showOld = !showOld">
        <span class="chevron">{{ showOld ? '▾' : '▸' }}</span>
        {{ showOld ? 'Verberg oude weken' : 'Toon oude weken' }}
      </button>
      <button class="old-toggle" @click="collapseAll">Klap alle weken in</button>
    </div>

    <div v-for="week in visibleWeeks" :key="week.week_number" class="week" :class="{ past: week.past }">
      <button class="week-head" :class="{ open: week.isOpen }" @click="toggle(week.index)">
        <span class="chevron">{{ week.isOpen ? '▾' : '▸' }}</span>
        <span class="week-label">{{ week.label }}</span>
        <span class="week-range pp-mono">{{ week.range }}</span>
        <span v-if="week.isCurrent" class="now-badge">nu</span>
        <span class="summary pp-mono">{{ week.summary }}</span>
      </button>

      <div v-if="week.isOpen" class="week-body">
        <div class="day-col">
          <div class="col-head">Per dag · op datum</div>
          <div class="day-rows">
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
      return this.todayIndex > 0
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

        const subjectItems = subjectEventsInWeek(this.events, week.week_number, this.year, this.courses)
        const testCount = subjectItems.filter((event) => typeMeta(event.type).test).length
        const schoolCount = schoolWideInWeek(this.events, week, this.year).length

        const parts = []
        if (subjectItems.length) {
          parts.push(`${subjectItems.length} ${subjectItems.length === 1 ? 'item' : 'items'}`)
        }
        if (testCount) {
          parts.push(`${testCount} ${testCount === 1 ? 'toets' : 'toetsen'}`)
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
          past: index < this.todayIndex,
          days,
          groups: buildWeekGroups(this.events, week.week_number, this.year, this.courses),
          summary: parts.length ? parts.join(' · ') : 'geen items',
        }
      })
    },
    visibleWeeks() {
      return this.showOld ? this.weekRows : this.weekRows.filter((week) => !week.past)
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
    collapseAll() {
      this.openWeeks = []
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

.week.past {
  opacity: 0.6;
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

.now-badge {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--on-accent);
  background: var(--accent);
  border-radius: 6px;
  padding: 2px 7px;
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

  .summary {
    display: none;
  }
}
</style>

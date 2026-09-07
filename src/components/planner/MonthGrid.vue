<template>
  <div class="month-scroll">
    <div class="month">
      <div class="month-head">
        <div class="head-cell">Deze week · per vak</div>
        <div class="head-cell">Per dag · op datum</div>
      </div>

      <div v-for="(row, rowIndex) in rows" :key="rowIndex" class="month-row" :class="{ last: row.last }">
        <div class="week-cell">
          <template v-if="row.week">
            <div class="week-label pp-mono">{{ weekLabel(row.week) }}</div>
            <div v-if="row.groups.length" class="week-events">
              <EventCard
                v-for="group in row.groups"
                :key="group.abbr"
                :group="group"
                :mode="cardMode"
                :subjects-map="subjectsMap"
                :when-label="weekLabel(row.week)"
                @open="$emit('open', $event)"
              />
            </div>
            <div v-else class="no-events">Geen vakactiviteiten deze week.</div>
          </template>
          <div v-else class="no-events">—</div>
        </div>

        <div class="days-cell">
          <DayRows :days="row.days" @open="openSchoolWide" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DayRows from './DayRows.vue'
import EventCard from './EventCard.vue'
import {
  addDays,
  buildDayRows,
  buildWeekGroups,
  parseDate,
  schoolWideWhenLabel,
} from '../../utils/plannerModel'

export default {
  name: 'MonthGrid',
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
    monthYear: {
      type: Number,
      required: true,
    },
    monthMonth: {
      type: Number,
      required: true,
    },
  },
  emits: ['open'],
  computed: {
    cardMode() {
      return this.detailLevel === 'compact' ? 'monthCompact' : 'monthFull'
    },
    weekByMonday() {
      const map = {}
      this.weeks.forEach((week) => {
        const start = parseDate(week.start_date)
        if (start) {
          map[start.getTime()] = week
        }
      })
      return map
    },
    rows() {
      const first = new Date(this.monthYear, this.monthMonth, 1, 12)
      const offset = (first.getDay() + 6) % 7
      const gridStart = addDays(first, -offset)
      const daysInMonth = new Date(this.monthYear, this.monthMonth + 1, 0).getDate()
      const rowCount = Math.ceil((offset + daysInMonth) / 7)

      const rows = []
      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const monday = addDays(gridStart, rowIndex * 7)

        const week = this.weekByMonday[monday.getTime()] || null

        rows.push({
          week,
          groups: week ? buildWeekGroups(this.events, week, this.year, this.courses) : [],
          // Elke rij is één week: links de vakken, rechts maandag t/m zondag
          // onder elkaar in plaats van naast elkaar.
          days: buildDayRows(this.events, monday, this.year, this.today, this.monthMonth),
          last: rowIndex === rowCount - 1,
        })
      }
      return rows
    },
  },
  methods: {
    weekLabel(week) {
      const weekNumber = week.week_number
      const label = String(week.label || '').trim()
      if (!label) {
        return `Week ${weekNumber}`
      }

      if (label.toLowerCase() === `week ${weekNumber}`.toLowerCase()) {
        return `Week ${weekNumber}`
      }

      return `${label} (wk ${weekNumber})`
    },
    openSchoolWide(event) {
      this.$emit('open', { event, whenLabel: schoolWideWhenLabel(event) })
    },
  },
}
</script>

<style scoped>
.month-scroll {
  overflow-x: auto;
}

.month {
  min-width: 720px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

/* Links tweederde voor de vakken van de week, rechts eenderde voor de losse
   dagen. minmax(0, …) in plaats van kale fr-waarden, anders duwt een lange
   dagnaam de kolom breder in plaats van af te kappen. */
.month-head,
.month-row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
}

.month-head {
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.head-cell {
  padding: 9px 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  border-left: 1px solid var(--border);
}

.head-cell:first-child {
  border-left: none;
}

.week-cell {
  padding: 10px 12px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}

.days-cell {
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.days-cell .day-rows {
  flex: 1;
}

.month-row.last .week-cell,
.month-row.last .days-cell {
  border-bottom: none;
}

.week-label {
  font-size: 10.5px;
  color: var(--faint);
  margin-bottom: 7px;
}

.week-events {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  align-items: start;
}

.no-events {
  color: var(--faint);
  font-size: 12px;
}

</style>

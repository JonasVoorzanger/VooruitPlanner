<template>
  <div class="month-scroll">
    <div class="month">
      <div class="month-head">
        <div class="head-cell first">Deze week</div>
        <div v-for="day in ['ma', 'di', 'wo', 'do', 'vr']" :key="day" class="head-cell">{{ day }}</div>
        <div class="head-cell">za · zo</div>
      </div>

      <div v-for="(row, rowIndex) in rows" :key="rowIndex" class="month-row" :class="{ last: row.last }">
        <div class="week-cell">
          <template v-if="row.week">
            <div class="week-label pp-mono">Week {{ row.week.week_number }}</div>
            <div v-if="row.groups.length" class="week-events">
              <EventCard
                v-for="group in row.groups"
                :key="group.abbr"
                :group="group"
                :mode="cardMode"
                :subjects-map="subjectsMap"
                :when-label="`Week ${row.week.week_number}`"
                @open="$emit('open', $event)"
              />
            </div>
            <div v-else class="no-events">—</div>
          </template>
        </div>

        <div
          v-for="(cell, cellIndex) in row.weekdays"
          :key="cellIndex"
          class="day-cell"
          :class="{ out: !cell.inMonth }"
        >
          <div class="num-row">
            <span class="num" :class="{ today: cell.isToday }">{{ cell.num }}</span>
          </div>
          <div class="chips">
            <div
              v-for="(chip, chipIndex) in cell.chips"
              :key="chipIndex"
              class="chip"
              :class="{ holiday: chip.holiday }"
              @click="openSchoolWide(chip.event)"
            >
              {{ chip.event.label }}
            </div>
          </div>
        </div>

        <div class="weekend-col">
          <div
            v-for="(cell, cellIndex) in row.weekend"
            :key="cellIndex"
            class="weekend-cell"
            :class="{ out: !cell.inMonth }"
          >
            <div class="weekend-head">
              <span class="weekend-day">{{ cell.weekday }}</span>
              <span class="num" :class="{ today: cell.isToday }">{{ cell.num }}</span>
            </div>
            <div class="chips">
              <div
                v-for="(chip, chipIndex) in cell.chips"
                :key="chipIndex"
                class="chip"
                :class="{ holiday: chip.holiday }"
                @click="openSchoolWide(chip.event)"
              >
                {{ chip.event.label }}
              </div>
            </div>
          </div>
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
  parseDate,
  sameDay,
  schoolWideOnDate,
  schoolWideWhenLabel,
  WEEKDAYS,
} from '../../utils/plannerModel'

export default {
  name: 'MonthGrid',
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

        const weekdays = []
        for (let column = 0; column < 5; column++) {
          weekdays.push(this.dayCell(addDays(monday, column)))
        }

        const weekend = [5, 6].map((column) => ({
          ...this.dayCell(addDays(monday, column)),
          weekday: WEEKDAYS[column],
        }))

        const week = this.weekByMonday[monday.getTime()] || null
        let groups = []
        if (week) {
          groups = buildWeekGroups(this.events, week.week_number, this.year, this.courses)
        }

        rows.push({
          week,
          groups,
          weekdays,
          weekend,
          last: rowIndex === rowCount - 1,
        })
      }
      return rows
    },
  },
  methods: {
    dayCell(date) {
      return {
        num: date.getDate(),
        inMonth: date.getMonth() === this.monthMonth,
        isToday: sameDay(date, this.today),
        chips: schoolWideOnDate(this.events, date, this.year).map((event) => ({
          event,
          holiday: Boolean(event.end_date) && !sameDay(parseDate(event.end_date) || date, parseDate(event.date) || date),
        })),
      }
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
  min-width: 880px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.month-head,
.month-row {
  display: grid;
  grid-template-columns: 300px repeat(5, 1fr) 0.5fr;
}

.month-head {
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.head-cell {
  padding: 9px 8px;
  text-align: center;
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
  border-left: 1px solid var(--border);
}

.head-cell.first {
  text-align: left;
  border-left: none;
}

.week-cell {
  padding: 8px 10px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}

.month-row.last .week-cell,
.month-row.last .day-cell {
  border-bottom: none;
}

.week-label {
  font-size: 10.5px;
  color: var(--faint);
  margin-bottom: 6px;
}

.week-events {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 6px;
  align-items: start;
}

.no-events {
  color: var(--faint);
  font-size: 12px;
}

.day-cell {
  min-height: 92px;
  padding: 7px 8px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--surface);
}

.day-cell.out,
.weekend-cell.out {
  background: var(--surface-2);
  opacity: 0.55;
}

.num-row {
  text-align: right;
}

.num {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text);
  border-radius: 999px;
  min-width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.day-cell.out .num,
.weekend-cell.out .num {
  color: var(--faint);
}

.num.today {
  font-weight: 700;
  color: var(--on-accent);
  background: var(--accent);
}

.chips {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
}

.chip {
  font-size: 10px;
  line-height: 1.25;
  padding: 2px 5px;
  border-radius: 5px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
  white-space: normal;
  word-break: break-word;
}

.chip:hover {
  border-color: var(--accent-border);
}

.chip.holiday {
  background: var(--accent-soft);
  border-color: var(--accent-border);
}

.weekend-col {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--border);
}

.month-row.last .weekend-col {
  border-bottom: none;
}

.weekend-cell {
  flex: 1;
  min-height: 44px;
  padding: 5px 7px;
  display: flex;
  flex-direction: column;
  background: var(--surface);
}

.weekend-cell:first-child {
  border-bottom: 1px solid var(--border);
}

.weekend-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.weekend-day {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--faint);
}

.weekend-cell .chips {
  margin-top: 3px;
}
</style>

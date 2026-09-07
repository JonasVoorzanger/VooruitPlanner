<template>
  <div class="print-doc" :class="view">
    <header class="doc-head">
      <div class="doc-title">
        <span class="logo pp-mono">P</span>
        <span>Periodeplanner · Klas {{ year }}</span>
      </div>
      <div class="doc-meta">
        <span class="pp-mono">{{ metaCourses }}</span>
        <span class="dot">·</span>
        <span>{{ rangeLabel }}</span>
        <span v-if="filterLabel" class="dot">·</span>
        <span v-if="filterLabel">{{ filterLabel }}</span>
      </div>
    </header>

    <template v-if="view === 'list'">
      <section v-for="week in listWeeks" :key="week.key" class="week">
        <div class="week-head">
          <span class="week-label">{{ week.label }}</span>
          <span class="week-range pp-mono">{{ week.range }}</span>
          <span class="week-summary pp-mono">{{ week.summary }}</span>
        </div>

        <div class="week-body">
          <div class="day-col">
            <div class="col-head">Per dag</div>
            <div v-if="week.hasDayItems">
              <div v-for="day in week.days" :key="day.label" class="day-row">
                <span class="day-label pp-mono">{{ day.label }}</span>
                <div class="day-events">
                  <div v-for="(event, index) in day.events" :key="index" class="day-event">
                    {{ event.label }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty">geen schoolbrede items</div>
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
              />
            </div>
            <div v-else class="empty">Geen vakactiviteiten deze week.</div>
          </div>
        </div>
      </section>
      <p v-if="!listWeeks.length" class="empty">Geen weken geselecteerd.</p>
    </template>

    <template v-else-if="view === 'subject'">
      <template v-for="week in subjectWeeks" :key="week.key">
        <section v-if="week.items.length" class="subject-week">
          <div class="week-head">
            <span class="week-label">{{ week.label }}</span>
            <span class="week-range pp-mono">{{ week.range }}</span>
            <span class="week-summary pp-mono">{{ week.summary }}</span>
          </div>
          <div class="subject-items">
            <div
              v-for="(item, index) in week.items"
              :key="index"
              class="subject-item"
              :class="{ test: item.isTest, exam: item.isExam }"
            >
              <div class="item-line">
                <span
                  v-if="item.isTest"
                  class="type-badge pp-mono"
                  :class="item.isExam ? 'exam' : 'test'"
                >{{ item.typeLabel }}</span>
                <span class="item-title">{{ item.title }}</span>
                <span v-if="item.weightLabel" class="weight pp-mono">{{ item.weightLabel }}</span>
              </div>
              <MarkdownContent v-if="item.description" class="item-desc" :content="item.description" />
            </div>
          </div>
        </section>

        <!-- Lege week: alleen een streepje, net als op het scherm. -->
        <div v-else class="subject-divider">
          <span class="divider-label pp-mono">{{ week.label }} · {{ week.range }}</span>
          <span class="divider-rule" aria-hidden="true"></span>
        </div>
      </template>
      <p v-if="!subjectWeeks.length" class="empty">Geen weken geselecteerd.</p>
    </template>

    <template v-else>
      <section v-for="(block, blockIndex) in monthBlocks" :key="block.key" class="month" :class="{ later: blockIndex > 0 }">
        <div class="month-title">{{ block.title }}</div>

        <div class="month-grid">
          <div class="month-head">
            <div class="head-cell first">Deze week</div>
            <div v-for="day in weekdayLabels" :key="day" class="head-cell">{{ day }}</div>
            <div class="head-cell">za · zo</div>
          </div>

          <div v-for="row in block.rows" :key="row.key" class="month-row">
            <div class="week-cell">
              <div class="week-cell-label pp-mono">{{ row.label }}</div>
              <div v-if="row.groups.length" class="week-cell-events">
                <EventCard
                  v-for="group in row.groups"
                  :key="group.abbr"
                  :group="group"
                  :mode="cardMode"
                  :subjects-map="subjectsMap"
                />
              </div>
              <div v-else class="no-events">—</div>
            </div>

            <div
              v-for="(cell, cellIndex) in row.weekdays"
              :key="cellIndex"
              class="day-cell"
              :class="{ out: !cell.inMonth }"
            >
              <div class="num">{{ cell.num }}</div>
              <div class="chips">
                <div v-for="(chip, chipIndex) in cell.chips" :key="chipIndex" class="chip">
                  {{ chip.label }}
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
                  <span class="num">{{ cell.num }}</span>
                </div>
                <div class="chips">
                  <div v-for="(chip, chipIndex) in cell.chips" :key="chipIndex" class="chip">
                    {{ chip.label }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <p v-if="!monthBlocks.length" class="empty">Geen weken geselecteerd.</p>
    </template>
  </div>
</template>

<script>
import EventCard from './EventCard.vue'
import MarkdownContent from '../MarkdownContent.vue'
import {
  addDays,
  buildWeekGroups,
  formatShort,
  formatWeekRange,
  formatYearShort,
  filtersLabel,
  isTestEvent,
  MONTHS,
  parseDate,
  schoolWideInWeek,
  schoolWideOnDate,
  subjectEventsInWeek,
  typeMeta,
  WEEKDAYS,
  weightLabel,
} from '../../utils/plannerModel'

export default {
  name: 'PrintDocument',
  components: {
    EventCard,
    MarkdownContent,
  },
  props: {
    // Alleen de weken die de leerling in het exportvenster heeft aangevinkt.
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
    view: {
      type: String,
      default: 'list',
    },
    detailLevel: {
      type: String,
      default: 'full',
    },
    filters: {
      type: Object,
      default: null,
    },
    // Het gekozen vak, alleen gebruikt in de vakweergave.
    course: {
      type: String,
      default: '',
    },
  },
  computed: {
    filterLabel() {
      return filtersLabel(this.filters)
    },
    metaCourses() {
      if (this.view === 'subject') {
        const name = this.subjectsMap[this.course] || ''
        return name ? `${this.course} · ${name}` : this.course
      }
      return this.courses.join(' · ')
    },
    // Elke gekozen week, met de items van één vak. Weken zonder items blijven
    // staan als streepje, zodat de leerling ziet dat de week bestaat.
    subjectWeeks() {
      if (!this.course) {
        return []
      }

      return this.weeks.map((week) => {
        const start = parseDate(week.start_date)
        const end = parseDate(week.end_date)

        const items = subjectEventsInWeek(this.events, week, this.year, [this.course])
          .map((event) => {
            const meta = typeMeta(event.type)
            return {
              typeLabel: meta.label,
              isTest: meta.test,
              isExam: Boolean(meta.exam),
              title: event.label || meta.label,
              weightLabel: meta.test ? weightLabel(event.weight) : '',
              description: event.description || '',
            }
          })
          .sort((a, b) => (a.isTest ? 0 : 1) - (b.isTest ? 0 : 1))

        const testCount = items.filter((item) => item.isTest).length

        return {
          key: `${week.start_date}-${week.week_number}`,
          label: week.label || `Week ${week.week_number}`,
          range: start && end ? `${formatWeekRange(start, end)} (wk ${week.week_number})` : '',
          items,
          summary: testCount
            ? `${items.length} ${items.length === 1 ? 'item' : 'items'} · ${testCount} ${testCount === 1 ? 'toets' : 'toetsen'}`
            : `${items.length} ${items.length === 1 ? 'item' : 'items'}`,
        }
      })
    },
    cardMode() {
      if (this.view === 'month') {
        return this.detailLevel === 'compact' ? 'monthCompact' : 'monthFull'
      }
      return this.detailLevel === 'compact' ? 'listCompact' : 'listFull'
    },
    weekdayLabels() {
      return WEEKDAYS.slice(0, 5)
    },
    rangeLabel() {
      if (!this.weeks.length) {
        return ''
      }

      const first = parseDate(this.weeks[0].start_date)
      const last = parseDate(this.weeks[this.weeks.length - 1].end_date)
      if (!first || !last) {
        return ''
      }

      return `${formatShort(first)} '${formatYearShort(first)} – ${formatShort(last)} '${formatYearShort(last)}`
    },
    listWeeks() {
      return this.weeks.map((week) => {
        const start = parseDate(week.start_date)
        const end = parseDate(week.end_date)

        const days = WEEKDAYS.map((weekday, dayIndex) => {
          const date = addDays(start, dayIndex)
          return {
            label: `${weekday} ${date.getDate()}`,
            events: schoolWideOnDate(this.events, date, this.year),
          }
        }).filter((day) => day.events.length > 0)

        const subjectItems = subjectEventsInWeek(this.events, week, this.year, this.courses)
        const testCount = subjectItems.filter(isTestEvent).length
        const schoolCount = schoolWideInWeek(this.events, week, this.year).length

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
          key: `${week.start_date}-${week.week_number}`,
          label: week.label || `Week ${week.week_number}`,
          range: start && end ? `${formatWeekRange(start, end)} (wk ${week.week_number})` : '',
          days,
          hasDayItems: days.length > 0,
          groups: buildWeekGroups(this.events, week, this.year, this.courses),
          summary: parts.length ? parts.join(' · ') : 'geen items',
        }
      })
    },
    // Maandweergave: alleen de gekozen weken, gegroepeerd per maand waarin de
    // week begint. Een week die over een maandgrens loopt blijft dus heel.
    monthBlocks() {
      const blocks = []

      this.weeks.forEach((week) => {
        const monday = parseDate(week.start_date)
        if (!monday) {
          return
        }

        const key = `${monday.getFullYear()}-${monday.getMonth()}`
        let block = blocks.find((candidate) => candidate.key === key)
        if (!block) {
          block = {
            key,
            month: monday.getMonth(),
            calYear: monday.getFullYear(),
            title: `${MONTHS[monday.getMonth()]} ${monday.getFullYear()}`,
            rows: [],
          }
          blocks.push(block)
        }

        const weekdays = []
        for (let column = 0; column < 5; column += 1) {
          weekdays.push(this.dayCell(addDays(monday, column), block.month))
        }

        const weekend = [5, 6].map((column) => ({
          ...this.dayCell(addDays(monday, column), block.month),
          weekday: WEEKDAYS[column],
        }))

        block.rows.push({
          key: `${week.start_date}-${week.week_number}`,
          label: this.weekLabel(week),
          groups: buildWeekGroups(this.events, week, this.year, this.courses),
          weekdays,
          weekend,
        })
      })

      return blocks
    },
  },
  methods: {
    weekLabel(week) {
      const label = String(week.label || '').trim()
      if (!label || label.toLowerCase() === `week ${week.week_number}`.toLowerCase()) {
        return `Week ${week.week_number}`
      }
      return `${label} (wk ${week.week_number})`
    },
    dayCell(date, month) {
      return {
        num: date.getDate(),
        inMonth: date.getMonth() === month,
        chips: schoolWideOnDate(this.events, date, this.year).map((event) => ({ label: event.label })),
      }
    },
  },
}
</script>

<style scoped>
/* Altijd de lichte kleuren: een donkere planner hoort niet zwart uit de
   printer te komen. */
.print-doc {
  --bg: #ffffff;
  --surface: #ffffff;
  --surface-2: #f4f5f8;
  --text: #1b1e29;
  --muted: #4d5262;
  --faint: #7c8194;
  --border: #cbd0da;
  --border-strong: #aeb4c2;
  --accent: #3b4ea8;
  --accent-soft: #eef1fb;
  --accent-border: #b9c2e6;
  --on-accent: #ffffff;
  --shadow: none;
  --shadow-lg: none;

  color: var(--text);
  background: #ffffff;
  font-size: 9pt;
  line-height: 1.35;
}

/* EventCard is ontworpen voor een beeldscherm; op papier mag alles een slag
   kleiner zodat er meerdere weken op één A4 passen. */
.print-doc :deep(.event-card) {
  padding: 1.4mm 1.8mm;
  gap: 1mm;
  border-radius: 1.5mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.print-doc :deep(.event-card:hover) {
  box-shadow: none;
  border-color: var(--border);
}

.print-doc :deep(.item-section) {
  gap: 1mm;
}

.print-doc :deep(.section-divider) {
  margin: 1mm 0;
}

.print-doc :deep(.test-section) {
  border-left-width: 0.8mm;
  padding-left: 1.5mm;
}

.print-doc :deep(.abbr) {
  font-size: 6.5pt;
  padding: 0 1mm;
}

.print-doc :deep(.type-badge),
.print-doc :deep(.weight) {
  font-size: 6pt;
}

.print-doc :deep(.item-title) {
  font-size: 7.5pt;
}

.print-doc :deep(.item-desc) {
  font-size: 6.5pt;
  line-height: 1.3;
}

.doc-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6mm;
  padding-bottom: 2mm;
  margin-bottom: 4mm;
  border-bottom: 1px solid var(--border-strong);
}

.doc-title {
  display: flex;
  align-items: center;
  gap: 2mm;
  font-size: 12pt;
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
  flex-shrink: 0;
}

.doc-title .logo {
  width: 5.5mm;
  height: 5.5mm;
  border-radius: 1.4mm;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 8pt;
  font-weight: 700;
}

.doc-meta {
  font-size: 7.5pt;
  color: var(--muted);
  text-align: right;
}

.doc-meta .dot {
  margin: 0 1mm;
  color: var(--faint);
}

/* ── Lijstweergave ──────────────────────────────────────────────────────── */

.week {
  border: 1px solid var(--border);
  border-radius: 2mm;
  margin-bottom: 3mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.week-head {
  display: flex;
  align-items: baseline;
  gap: 3mm;
  padding: 1.4mm 3mm;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  break-inside: avoid;
  page-break-inside: avoid;
  break-after: avoid;
  page-break-after: avoid;
}

.week-label {
  font-size: 10pt;
  font-weight: 700;
}

.week-range {
  font-size: 7.5pt;
  color: var(--muted);
}

.week-summary {
  margin-left: auto;
  font-size: 7.5pt;
  color: var(--faint);
}

/* ── Vakweergave ─────────────────────────────────────────────────────────── */
.subject-week {
  border: 1px solid var(--border);
  border-radius: 2mm;
  margin-bottom: 2.5mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.subject-items {
  display: flex;
  flex-direction: column;
  gap: 1.5mm;
  padding: 2mm 3mm 2.5mm;
}

.subject-item {
  border: 1px solid var(--border);
  border-radius: 1.6mm;
  padding: 1.4mm 2.4mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.subject-item.test {
  border-left: 0.9mm solid var(--accent);
}

.subject-item.exam {
  border-left-color: var(--exam);
}

.subject-item .item-line {
  display: flex;
  align-items: baseline;
  gap: 2mm;
  flex-wrap: wrap;
}

/* Planning is de standaard en blijft grijs; toetsen krijgen de accentkleur. */
.subject-item .type-badge {
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.subject-item .type-badge.test {
  color: var(--accent);
}

.subject-item .type-badge.exam {
  color: var(--exam);
}

.subject-item .item-title {
  font-weight: 600;
}

.subject-item .item-desc {
  color: var(--muted);
  margin-top: 0.6mm;
}

.subject-divider {
  display: flex;
  align-items: center;
  gap: 2mm;
  padding: 0 1mm;
  margin-bottom: 2.5mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.subject-divider .divider-label {
  font-size: 7pt;
  color: var(--faint);
  white-space: nowrap;
}

.subject-divider .divider-rule {
  flex: 1;
  height: 1px;
  background: var(--border);
}

.week-body {
  display: grid;
  grid-template-columns: 58mm 1fr;
}

.day-col {
  border-right: 1px solid var(--border);
}

.col-head {
  padding: 1.2mm 3mm;
  font-size: 6.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  border-bottom: 1px solid var(--border);
}

.day-row {
  display: flex;
  gap: 2.5mm;
  padding: 1.2mm 3mm;
  border-bottom: 1px solid var(--border);
  break-inside: avoid;
  page-break-inside: avoid;
}

.day-row:last-child {
  border-bottom: none;
}

.day-label {
  font-size: 7.5pt;
  color: var(--muted);
  min-width: 11mm;
  flex-shrink: 0;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 0.8mm;
}

.day-event {
  font-size: 8pt;
}

.subject-grid {
  padding: 1.8mm;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(38mm, 1fr));
  gap: 1.5mm;
  align-items: start;
}

.empty {
  padding: 2.5mm 3mm;
  font-size: 8pt;
  color: var(--faint);
}

/* ── Maandweergave ──────────────────────────────────────────────────────── */

.month.later {
  margin-top: 4mm;
}

.month-title {
  font-size: 11pt;
  font-weight: 700;
  margin: 0 0 2mm;
  break-after: avoid;
  page-break-after: avoid;
}

.month-grid {
  border: 0;
}

.month-head,
.month-row {
  display: grid;
  grid-template-columns: 96mm repeat(5, 1fr) 0.6fr;
}

.month-head {
  background: var(--surface-2);
  border: 1px solid var(--border);
  break-after: avoid;
  page-break-after: avoid;
  break-inside: avoid;
  page-break-inside: avoid;
}

.head-cell {
  padding: 1.2mm 1.5mm;
  text-align: center;
  font-size: 6.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
  border-left: 1px solid var(--border);
}

.head-cell.first {
  text-align: left;
  border-left: none;
}

.month-row {
  border: 1px solid var(--border);
  border-top: 0;
  break-inside: avoid;
  page-break-inside: avoid;
}

.week-cell {
  padding: 1.5mm 2mm;
  border-right: 1px solid var(--border);
  background: var(--surface-2);
}

.week-cell-label {
  font-size: 7pt;
  color: var(--faint);
  margin-bottom: 1.2mm;
}

.week-cell-events {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(29mm, 1fr));
  gap: 1.2mm;
  align-items: start;
}

.no-events {
  font-size: 8pt;
  color: var(--faint);
}

.day-cell {
  min-height: 13mm;
  padding: 1.2mm 1.5mm;
  border-right: 1px solid var(--border);
}

.day-cell.out,
.weekend-cell.out {
  background: var(--surface-2);
  color: var(--faint);
}

.num {
  font-size: 8pt;
  font-weight: 600;
  text-align: right;
}

.chips {
  display: flex;
  flex-direction: column;
  gap: 0.7mm;
  margin-top: 0.8mm;
}

.chip {
  font-size: 6.5pt;
  line-height: 1.2;
  padding: 0.5mm 1mm;
  border-radius: 1mm;
  background: var(--accent-soft);
  border: 1px solid var(--accent-border);
}

.weekend-col {
  display: flex;
  flex-direction: column;
}

.weekend-cell {
  flex: 1;
  padding: 1mm 1.5mm;
}

.weekend-cell:first-child {
  border-bottom: 1px solid var(--border);
}

.weekend-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1mm;
}

.weekend-day {
  font-size: 6.5pt;
  text-transform: uppercase;
  color: var(--faint);
}
</style>

<template>
  <div class="subject-view">
    <div class="top-controls">
      <div class="subject-picker">
        <button
          v-for="option in courseOptions"
          :key="option.abbr"
          class="subject-chip"
          :class="{ active: option.abbr === course }"
          :title="option.name"
          @click="$emit('update:course', option.abbr)"
        >
          <span class="abbr pp-mono">{{ option.abbr }}</span>
          <span class="full">{{ option.name }}</span>
        </button>
      </div>
      <button v-if="hasPast" class="old-toggle" @click="showOld = !showOld">
        <span class="chevron">{{ showOld ? '▾' : '▸' }}</span>
        {{ showOld ? 'Verberg oude weken' : 'Toon oude weken' }}
      </button>
    </div>

    <p v-if="!totalItems" class="notice">
      <span class="mdi mdi-information-outline" aria-hidden="true"></span>
      <span>Geen items voor {{ courseName }} in de getoonde weken.</span>
    </p>

    <div class="weeks">
      <template v-for="week in visibleWeeks" :key="week.key">
        <section v-if="week.items.length" class="week-block">
          <div class="week-head">
            <span class="week-label">{{ week.label }}</span>
            <span class="week-range pp-mono">{{ week.range }}</span>
            <span v-if="week.isCurrent" class="status-badge current">nu</span>
            <span v-else-if="week.past" class="status-badge past">al voorbij</span>
            <span class="summary pp-mono">{{ week.summary }}</span>
          </div>

          <div class="items">
            <article
              v-for="(item, index) in week.items"
              :key="index"
              class="item"
              :class="{ test: item.isTest }"
              @click="$emit('open', { event: item.event, whenLabel: week.label })"
            >
              <div class="item-line">
                <span class="type-badge pp-mono">{{ item.typeLabel }}</span>
                <span class="item-title">{{ item.title }}</span>
                <span v-if="item.weightLabel" class="weight pp-mono">{{ item.weightLabel }}</span>
              </div>
              <MarkdownContent v-if="item.description" class="item-desc" :content="item.description" />
            </article>
          </div>
        </section>

        <!-- Lege week: alleen een streepje, zodat de week wel zichtbaar blijft. -->
        <div v-else class="week-divider" :class="{ current: week.isCurrent }">
          <span class="divider-label pp-mono">{{ week.label }} · {{ week.range }}</span>
          <span v-if="week.isCurrent" class="status-badge current">nu</span>
          <span class="divider-rule" aria-hidden="true"></span>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import MarkdownContent from '../MarkdownContent.vue'
import {
  formatShort,
  formatYearShort,
  parseDate,
  subjectEventsInWeek,
  typeMeta,
  weightLabel,
} from '../../utils/plannerModel'

export default {
  name: 'SubjectView',
  components: {
    MarkdownContent,
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
    course: {
      type: String,
      default: '',
    },
    today: {
      type: Date,
      required: true,
    },
  },
  emits: ['open', 'update:course'],
  data() {
    return {
      showOld: false,
    }
  },
  computed: {
    courseOptions() {
      return this.courses.map((abbr) => ({ abbr, name: this.subjectsMap[abbr] || abbr }))
    },
    courseName() {
      return this.subjectsMap[this.course] || this.course
    },
    hasPast() {
      return this.weeks.some((week) => {
        const end = parseDate(week.end_date)
        return end && end < this.today
      })
    },
    weekRows() {
      return this.weeks.map((week, index) => {
        const start = parseDate(week.start_date)
        const end = parseDate(week.end_date)

        const items = subjectEventsInWeek(this.events, week, this.year, [this.course])
          .map((event) => {
            const meta = typeMeta(event.type)
            return {
              event,
              typeLabel: meta.label,
              isTest: meta.test,
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
          range:
            start && end
              ? `${start.getDate()} – ${formatShort(end)} '${formatYearShort(end)} (wk ${week.week_number})`
              : '',
          isCurrent: Boolean(start && end) && this.today >= start && this.today <= end,
          past: Boolean(end) && end < this.today,
          items,
          summary: testCount
            ? `${items.length} ${items.length === 1 ? 'item' : 'items'} · ${testCount} ${testCount === 1 ? 'toets' : 'toetsen'}`
            : `${items.length} ${items.length === 1 ? 'item' : 'items'}`,
        }
      })
    },
    visibleWeeks() {
      return this.weekRows.filter((week) => this.showOld || !week.past)
    },
    totalItems() {
      return this.visibleWeeks.reduce((total, week) => total + week.items.length, 0)
    },
  },
}
</script>

<style scoped>
.subject-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.top-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.subject-picker {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.subject-chip {
  display: inline-flex;
  /* Niet baseline: dat duwt de tekst tegen de bovenkant en laat een gat onder. */
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 11px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  font-family: inherit;
  font-size: 12.5px;
}

.subject-chip:hover {
  border-color: var(--accent-border);
  color: var(--text);
}

.subject-chip .abbr {
  font-weight: 600;
  font-size: 11.5px;
}

.subject-chip.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

/* Op smalle schermen is de volledige vaknaam te veel; de afkorting volstaat. */
@media (max-width: 760px) {
  .subject-chip .full {
    display: none;
  }
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
  flex-shrink: 0;
}

.old-toggle:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.old-toggle .chevron {
  font-size: 11px;
}

.notice {
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

.notice .mdi {
  font-size: 17px;
  line-height: 1.2;
  flex-shrink: 0;
}

.weeks {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.week-block {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 13px;
  overflow: hidden;
}

.week-head {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 15px;
  border-bottom: 1px solid var(--border);
}

.week-label {
  font-size: 15.5px;
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

.items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 15px 14px;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: border-color 0.12s, box-shadow 0.12s, transform 0.12s;
}

.item:hover {
  border-color: var(--accent-border);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-1px);
}

.item.test {
  border-left: 4px solid var(--accent);
}

.item-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

/* Planning is de standaard en blijft grijs; alleen toetsen krijgen de
   accentkleur, zodat die er echt uitspringen. */
.type-badge {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.item.test .type-badge {
  color: var(--accent);
}

.item-title {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text);
  text-wrap: pretty;
}

.weight {
  font-size: 10px;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 0 5px;
  white-space: nowrap;
}

.item-desc {
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.45;
  text-wrap: pretty;
}

.item-desc :deep(p) {
  margin: 0;
}

.week-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 1px 4px;
}

.divider-label {
  font-size: 11.5px;
  color: var(--faint);
  white-space: nowrap;
}

.divider-rule {
  flex: 1;
  height: 1px;
  background: var(--border);
}

.week-divider.current .divider-label {
  color: var(--muted);
}

/* Smal scherm: naam en badge op één regel, de datums eronder. */
@media (max-width: 760px) {
  .week-head {
    flex-wrap: wrap;
    row-gap: 4px;
    padding: 11px 13px;
  }

  .week-label {
    font-size: 15px;
  }

  .summary {
    order: 2;
  }

  .week-range {
    order: 3;
    flex-basis: 100%;
  }

  .items {
    padding: 10px 13px 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .item {
    transition: border-color 0.12s, box-shadow 0.12s;
  }

  .item:hover {
    transform: none;
  }
}
</style>

<template>
  <div class="screen">
    <div class="container">
      <header class="mobile-topbar">
        <button class="menu-btn" aria-label="Open menu" @click="menuOpen = true">
          <span class="mdi mdi-menu" aria-hidden="true"></span>
          <span>Menu</span>
        </button>
      </header>

      <header class="topbar">
        <div class="brand">
          <div class="logo pp-mono">P</div>
          <div>
            <div class="context-title">{{ contextTitle }}</div>
            <div class="context-sub">{{ contextSub }}</div>
          </div>
        </div>
        <div class="topbar-actions">
          <button class="icon-btn" title="Thema" @click="toggleTheme">{{ themeIcon }}</button>
          <button class="text-btn" @click="$router.push('/')">Wijzig</button>
        </div>
      </header>

      <div class="controls">
        <div v-if="view === 'month'" class="month-nav">
          <button class="nav-btn today-btn" @click="goToday">Vandaag</button>
          <div class="arrows">
            <button class="icon-btn arrow" @click="prevMonth">‹</button>
            <button class="icon-btn arrow" @click="nextMonth">›</button>
          </div>
        </div>
        <div class="range-label">{{ rangeLabel }}</div>
        <div class="segments">
          <div class="segment-group">
            <button
              v-for="option in viewOptions"
              :key="option.value"
              class="segment"
              :disabled="isNarrowScreen && option.value === 'month'"
              :class="{ active: view === option.value }"
              @click="setView(option.value)"
            >
              <span class="segment-content">
                <span class="mdi" :class="option.icon" aria-hidden="true"></span>
                <span>{{ option.label }}</span>
              </span>
            </button>
          </div>
          <div v-if="isNarrowScreen" class="view-hint">Maand-weergave alleen op grote schermen</div>
          <div class="segment-group">
            <button
              v-for="option in detailOptions"
              :key="option.value"
              class="segment"
              :class="{ active: detailLevel === option.value }"
              @click="detailLevel = option.value"
            >
              <span class="segment-content">
                <span class="mdi" :class="option.icon" aria-hidden="true"></span>
                <span>{{ option.label }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="menuOpen" class="mobile-menu-overlay" @click.self="closeMenu">
        <div class="mobile-menu-panel">
          <div class="mobile-menu-head">
            <div class="mobile-menu-title">PeriodePlanner</div>
            <button class="icon-btn" title="Sluiten" @click="closeMenu">
              <span class="mdi mdi-close" aria-hidden="true"></span>
            </button>
          </div>

          <div class="mobile-menu-subjects pp-mono">{{ mobileSubjectLine }}</div>

          <div class="mobile-menu-actions">
            <button class="icon-btn" title="Thema" @click="toggleTheme">{{ themeIcon }}</button>
            <button class="text-btn" @click="$router.push('/'); closeMenu()">Wijzig</button>
          </div>

          <div class="mobile-controls">
            <div v-if="view === 'month'" class="month-nav">
              <button class="nav-btn today-btn" @click="goToday">Vandaag</button>
              <div class="arrows">
                <button class="icon-btn arrow" @click="prevMonth">‹</button>
                <button class="icon-btn arrow" @click="nextMonth">›</button>
              </div>
            </div>

            <div class="range-label">{{ rangeLabel }}</div>

            <div class="segments mobile-segments">
              <div class="segment-group">
                <button
                  v-for="option in viewOptions"
                  :key="`menu-view-${option.value}`"
                  class="segment"
                  :disabled="isNarrowScreen && option.value === 'month'"
                  :class="{ active: view === option.value }"
                  @click="setView(option.value, true)"
                >
                  <span class="segment-content">
                    <span class="mdi" :class="option.icon" aria-hidden="true"></span>
                    <span>{{ option.label }}</span>
                  </span>
                </button>
              </div>
              <div v-if="isNarrowScreen" class="view-hint">Maand-weergave alleen op grote schermen</div>

              <div class="segment-group">
                <button
                  v-for="option in detailOptions"
                  :key="`menu-detail-${option.value}`"
                  class="segment"
                  :class="{ active: detailLevel === option.value }"
                  @click="setDetailLevel(option.value, true)"
                >
                  <span class="segment-content">
                    <span class="mdi" :class="option.icon" aria-hidden="true"></span>
                    <span>{{ option.label }}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <WeekList
        v-if="view === 'list'"
        :weeks="weeks"
        :events="events"
        :subjects-map="subjectsMap"
        :year="year"
        :courses="courses"
        :detail-level="detailLevel"
        :today="today"
        :today-index="todayIndex"
        @open="openEvent"
      />

      <MonthGrid
        v-else
        :weeks="weeks"
        :events="events"
        :subjects-map="subjectsMap"
        :year="year"
        :courses="courses"
        :detail-level="detailLevel"
        :today="today"
        :month-year="monthYear"
        :month-month="monthMonth"
        @open="openEvent"
      />
    </div>

    <EventModal v-if="activeDetails.length" :details="activeDetails" @close="activeDetails = []" />
  </div>
</template>

<script>
import EventModal from '../components/planner/EventModal.vue'
import MonthGrid from '../components/planner/MonthGrid.vue'
import WeekList from '../components/planner/WeekList.vue'
import { useTheme } from '../composables/useTheme'
import { useSpreadsheetStore } from '../stores/spreadsheet'
import { eventDetail, MONTHS, parseDate, saveSelection } from '../utils/plannerModel'

export default {
  name: 'PlannerView',
  components: {
    EventModal,
    MonthGrid,
    WeekList,
  },
  setup() {
    const { theme, toggleTheme } = useTheme()
    return { theme, toggleTheme }
  },
  data() {
    const today = new Date()
    today.setHours(12, 0, 0, 0)

    const storedView = localStorage.getItem('plannerViewMode')

    return {
      spreadsheetStore: useSpreadsheetStore(),
      today,
      menuOpen: false,
      isNarrowScreen: false,
      view: storedView === 'month' ? 'month' : 'list',
      detailLevel: localStorage.getItem('plannerDetailLevel') === 'compact' ? 'compact' : 'full',
      monthYear: today.getFullYear(),
      monthMonth: today.getMonth(),
      activeDetails: [],
      viewOptions: [
        { value: 'list', label: 'Lijst', icon: 'mdi-view-list' },
        { value: 'month', label: 'Maand', icon: 'mdi-calendar-month-outline' },
      ],
      detailOptions: [
        { value: 'compact', label: 'Compact', icon: 'mdi-magnify-minus-outline' },
        { value: 'full', label: 'Uitgebreid', icon: 'mdi-magnify-plus-outline' },
      ],
    }
  },
  computed: {
    year() {
      return Number(this.$route.params.year)
    },
    courses() {
      return String(this.$route.params.courses || '')
        .split('.')
        .map((course) => course.trim().toUpperCase())
        .filter(Boolean)
    },
    weeks() {
      // Week numbers restart at 1 in January, so sort by date rather than
      // relying on spreadsheet order.
      return [...this.spreadsheetStore.weeks].sort((a, b) => {
        const startA = parseDate(a.start_date)
        const startB = parseDate(b.start_date)
        return (startA ? startA.getTime() : 0) - (startB ? startB.getTime() : 0)
      })
    },
    events() {
      return this.spreadsheetStore.events
    },
    subjectsMap() {
      return this.spreadsheetStore.subjects.reduce((map, subject) => {
        map[subject.abbreviation] = subject.full_name
        return map
      }, {})
    },
    todayIndex() {
      const containing = this.weeks.findIndex((week) => {
        const start = parseDate(week.start_date)
        const end = parseDate(week.end_date)
        return start && end && this.today >= start && this.today <= end
      })
      if (containing >= 0) {
        return containing
      }

      const upcoming = this.weeks.findIndex((week) => {
        const start = parseDate(week.start_date)
        return start && start > this.today
      })
      if (upcoming >= 0) {
        return upcoming
      }

      return Math.max(this.weeks.length - 1, 0)
    },
    contextTitle() {
      return `Klas ${this.year}`
    },
    contextSub() {
      const count = this.courses.length
      return `${count} ${count === 1 ? 'vak' : 'vakken'} · ${this.courses.join(' · ')}`
    },
    mobileSubjectLine() {
      return this.courses.length ? this.courses.join(' · ') : 'Geen vakken geselecteerd'
    },
    rangeLabel() {
      if (this.view === 'month') {
        return `${MONTHS[this.monthMonth]} ${this.monthYear}`
      }
      return 'Komende weken'
    },
    themeIcon() {
      return this.theme === 'light' ? '☾' : '☀'
    },
    anchorDate() {
      const anchorWeek = this.weeks[this.todayIndex]
      return (anchorWeek && parseDate(anchorWeek.start_date)) || this.today
    },
  },
  watch: {
    view(value) {
      localStorage.setItem('plannerViewMode', value)
    },
    detailLevel(value) {
      localStorage.setItem('plannerDetailLevel', value)
    },
    '$route.params': {
      handler() {
        this.validateSelection()
      },
      deep: true,
    },
    '$route.fullPath'() {
      this.closeMenu()
    },
  },
  created() {
    this.validateSelection()
  },
  mounted() {
    this.updateScreenMode()
    window.addEventListener('resize', this.updateScreenMode)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateScreenMode)
  },
  methods: {
    validateSelection() {
      if (this.$route.name !== 'planner') {
        return
      }
      if (!Number.isInteger(this.year) || this.year < 4 || this.year > 5 || !this.courses.length) {
        this.$router.replace('/')
        return
      }
      saveSelection({ year: this.year, courses: this.courses })
    },
    setView(view, shouldCloseMenu = false) {
      if (this.isNarrowScreen && view === 'month') {
        return
      }
      this.view = view
      if (view === 'month') {
        this.goToday()
      }
      if (shouldCloseMenu) {
        this.closeMenu()
      }
    },
    updateScreenMode() {
      this.isNarrowScreen = window.innerWidth <= 760
      if (this.isNarrowScreen && this.view === 'month') {
        this.view = 'list'
      }
    },
    setDetailLevel(level, shouldCloseMenu = false) {
      this.detailLevel = level
      if (shouldCloseMenu) {
        this.closeMenu()
      }
    },
    closeMenu() {
      this.menuOpen = false
    },
    goToday() {
      this.monthYear = this.anchorDate.getFullYear()
      this.monthMonth = this.anchorDate.getMonth()
    },
    prevMonth() {
      if (this.monthMonth === 0) {
        this.monthMonth = 11
        this.monthYear -= 1
      } else {
        this.monthMonth -= 1
      }
    },
    nextMonth() {
      if (this.monthMonth === 11) {
        this.monthMonth = 0
        this.monthYear += 1
      } else {
        this.monthMonth += 1
      }
    },
    openEvent({ event, events, whenLabel }) {
      const sourceEvents = Array.isArray(events) && events.length ? events : [event].filter(Boolean)
      this.activeDetails = sourceEvents.map((item) => eventDetail(item, this.subjectsMap, whenLabel))
    },
  },
}
</script>

<style scoped>
.screen {
  min-height: 100vh;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px 64px;
}

.mobile-topbar {
  display: none;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 0 14px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--on-accent);
  font-weight: 700;
  font-size: 14px;
}

.context-title {
  font-weight: 600;
  font-size: 14.5px;
  line-height: 1.1;
}

.context-sub {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.2;
}

.topbar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  border-color: var(--accent-border);
  color: var(--text);
}

.text-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
}

.text-btn:hover {
  border-color: var(--accent-border);
  color: var(--text);
}

.controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 0 18px;
  border-top: 1px solid var(--border);
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
}

.nav-btn:hover {
  border-color: var(--accent-border);
}

.arrows {
  display: flex;
  align-items: center;
  gap: 2px;
}

.icon-btn.arrow {
  width: 36px;
  height: 36px;
  font-size: 16px;
}

.range-label {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
  min-width: 180px;
}

.segments {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.segment-group {
  display: flex;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}

.segment {
  padding: 6px 13px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
}

.segment:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.segment-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.segment-content .mdi {
  font-size: 17px;
  line-height: 1;
}

.segment.active {
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
  box-shadow: var(--shadow);
}

.segment.active:disabled {
  background: var(--surface-2);
  box-shadow: none;
}

.view-hint {
  width: 100%;
  font-size: 12px;
  color: var(--muted);
  margin-top: -2px;
}

.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: color-mix(in oklab, var(--bg) 75%, black 25%);
  padding: 0;
}

.mobile-menu-panel {
  width: 100%;
  min-height: 100%;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.mobile-menu-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mobile-menu-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.mobile-menu-subjects {
  font-size: 12px;
  color: var(--muted);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 10px 2px;
}

.mobile-menu-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mobile-segments {
  margin-left: 0;
  flex-direction: column;
  align-items: stretch;
}

.mobile-segments .segment-group {
  width: 100%;
  justify-content: stretch;
}

.mobile-segments .segment {
  flex: 1;
  padding: 9px 11px;
}

@media (max-width: 760px) {
  .container {
    padding: 0 14px 52px;
  }

  .mobile-topbar {
    display: flex;
    justify-content: flex-end;
    padding: 14px 0 10px;
  }

  .menu-btn {
    height: 38px;
    padding: 0 13px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .menu-btn .mdi {
    font-size: 18px;
    line-height: 1;
  }

  .topbar,
  .controls {
    display: none;
  }

  .mobile-menu-actions .text-btn,
  .mobile-menu-actions .icon-btn {
    height: 36px;
  }

  .mobile-controls .range-label {
    min-width: 0;
    font-size: 20px;
  }
}
</style>

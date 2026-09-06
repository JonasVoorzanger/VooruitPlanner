<template>
  <div class="screen pp-screen-only">
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
          <button class="text-btn" @click="$router.push('/')">Wijzig vakken</button>
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
          <div v-if="view !== 'subject'" class="segment-group">
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
          <div ref="filterWrap" class="filter-wrap">
            <button
              class="filter-btn"
              :class="{ active: isFiltered }"
              :aria-expanded="filterOpen ? 'true' : 'false'"
              title="Kies welke soorten items je ziet"
              @click="filterOpen = !filterOpen"
            >
              <span class="segment-content">
                <span class="mdi mdi-filter-variant" aria-hidden="true"></span>
                <span>Filter</span>
                <span v-if="isFiltered" class="filter-count pp-mono">{{ activeFilterCount }}/3</span>
              </span>
            </button>

            <div v-if="filterOpen" class="filter-menu">
              <label v-for="option in filterOptions" :key="option.value" class="filter-option">
                <input
                  type="checkbox"
                  :checked="filters[option.value]"
                  @change="toggleFilter(option.value)"
                />
                <span class="mdi" :class="option.icon" aria-hidden="true"></span>
                <span>{{ option.label }}</span>
              </label>
              <div class="filter-hint">Overig zijn de schoolbrede activiteiten en vakanties.</div>
            </div>
          </div>
          <button class="filter-btn" title="Exporteren naar A4" @click="openExport()">
            <span class="segment-content">
              <span class="mdi mdi-printer-outline" aria-hidden="true"></span>
              <span>Exporteren</span>
            </span>
          </button>
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
              <div v-if="view !== 'subject'" class="segment-group">
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

              <div class="mobile-filter">
                <div class="mobile-filter-label">Filter</div>
                <div class="mobile-filter-options">
                  <button
                    v-for="option in filterOptions"
                    :key="`menu-filter-${option.value}`"
                    class="filter-btn"
                    :class="{ active: filters[option.value] }"
                    :aria-pressed="filters[option.value] ? 'true' : 'false'"
                    @click="toggleFilter(option.value)"
                  >
                    <span class="segment-content">
                      <span class="mdi" :class="option.icon" aria-hidden="true"></span>
                      <span>{{ option.label }}</span>
                    </span>
                  </button>
                </div>
              </div>

              <button class="filter-btn" @click="openExport(true)">
                <span class="segment-content">
                  <span class="mdi mdi-printer-outline" aria-hidden="true"></span>
                  <span>Exporteren</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <SubjectView
        v-if="view === 'subject'"
        :weeks="weeks"
        :events="visibleEvents"
        :subjects-map="subjectsMap"
        :year="year"
        :courses="courses"
        :course="subjectCourse"
        :today="today"
        @update:course="setSubjectCourse"
        @open="openEvent"
      />

      <WeekList
        v-else-if="view === 'list'"
        :weeks="weeks"
        :events="visibleEvents"
        :all-events="events"
        :subjects-map="subjectsMap"
        :year="year"
        :courses="courses"
        :detail-level="detailLevel"
        :today="today"
        :today-index="todayIndex"
        @open="openEvent"
      />

      <MonthGrid
        v-else-if="view === 'month'"
        :weeks="weeks"
        :events="visibleEvents"
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

    <ExportDialog
      v-if="exportOpen"
      :weeks="weeks"
      :events="events"
      :year="year"
      :courses="courses"
      :today="today"
      :initial-view="view"
      :initial-detail-level="detailLevel"
      :initial-filters="filters"
      @close="exportOpen = false"
      @export="runExport"
    />
  </div>

  <div v-if="exportSettings" class="pp-print-root">
    <PrintDocument
      :weeks="exportSettings.weeks"
      :events="exportEvents"
      :subjects-map="subjectsMap"
      :year="year"
      :courses="courses"
      :view="exportSettings.view"
      :detail-level="exportSettings.detailLevel"
      :filters="exportSettings.filters"
    />
  </div>
</template>

<script>
import EventModal from '../components/planner/EventModal.vue'
import ExportDialog from '../components/planner/ExportDialog.vue'
import MonthGrid from '../components/planner/MonthGrid.vue'
import PrintDocument from '../components/planner/PrintDocument.vue'
import SubjectView from '../components/planner/SubjectView.vue'
import WeekList from '../components/planner/WeekList.vue'
import { useTheme } from '../composables/useTheme'
import { useSpreadsheetStore } from '../stores/spreadsheet'
import {
  eventDetail,
  FILTER_CATEGORIES,
  filterEventsByCategory,
  formatNumericDate,
  loadFilters,
  MONTHS,
  parseDate,
  saveFilters,
  saveSelection,
} from '../utils/plannerModel'
import { printAfterRender } from '../utils/print'

export default {
  name: 'PlannerView',
  components: {
    EventModal,
    ExportDialog,
    MonthGrid,
    PrintDocument,
    SubjectView,
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
      view: ['month', 'subject'].includes(storedView) ? storedView : 'list',
      subjectCourse: localStorage.getItem('plannerSubjectCourse') || '',
      detailLevel: localStorage.getItem('plannerDetailLevel') === 'compact' ? 'compact' : 'full',
      filters: loadFilters(),
      filterOpen: false,
      monthYear: today.getFullYear(),
      monthMonth: today.getMonth(),
      activeDetails: [],
      exportOpen: false,
      exportSettings: null,
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
    visibleEvents() {
      return filterEventsByCategory(this.events, this.filters)
    },
    activeFilterCount() {
      return this.filterOptions.filter((option) => this.filters[option.value]).length
    },
    isFiltered() {
      return this.activeFilterCount < this.filterOptions.length
    },
    exportEvents() {
      if (!this.exportSettings) {
        return []
      }
      return filterEventsByCategory(this.events, this.exportSettings.filters)
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
      if (this.view === 'subject') {
        return this.subjectsMap[this.subjectCourse] || this.subjectCourse || 'Per vak'
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
    subjectCourse(value) {
      localStorage.setItem('plannerSubjectCourse', value)
    },
    filters: {
      handler(value) {
        saveFilters(value)
      },
      deep: true,
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
    document.addEventListener('click', this.onDocumentClick)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateScreenMode)
    document.removeEventListener('click', this.onDocumentClick)
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
      this.validateSubjectCourse()
    },
    // Valt terug op het eerste vak zodra het bewaarde vak niet meer gekozen is.
    validateSubjectCourse() {
      if (!this.courses.includes(this.subjectCourse)) {
        this.subjectCourse = this.courses[0] || ''
      }
    },
    setSubjectCourse(course) {
      this.subjectCourse = course
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
    toggleFilter(category) {
      this.filters = { ...this.filters, [category]: !this.filters[category] }
    },
    onDocumentClick(event) {
      if (!this.filterOpen) {
        return
      }
      const wrap = this.$refs.filterWrap
      if (wrap && !wrap.contains(event.target)) {
        this.filterOpen = false
      }
    },
    openExport(shouldCloseMenu = false) {
      this.exportOpen = true
      this.filterOpen = false
      if (shouldCloseMenu) {
        this.closeMenu()
      }
    },
    runExport(settings) {
      this.exportOpen = false
      this.exportSettings = settings
      printAfterRender(
        this,
        settings.view === 'month' ? 'landscape' : 'portrait',
        this.exportDocumentName(settings.weeks),
      )
    },
    // Bepaalt de naam die de browser voorstelt bij "Opslaan als pdf".
    exportDocumentName(weeks) {
      const dates = (weeks || [])
        .flatMap((week) => [parseDate(week.start_date), parseDate(week.end_date)])
        .filter(Boolean)

      if (!dates.length) {
        return 'Planner'
      }

      const start = new Date(Math.min(...dates.map((date) => date.getTime())))
      const end = new Date(Math.max(...dates.map((date) => date.getTime())))
      return `Planner ${formatNumericDate(start)}-${formatNumericDate(end)}`
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
  background: var(--surface-2);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
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

.filter-btn {
  height: 40px;
  padding: 0 13px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--muted);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
}

.filter-btn:hover {
  color: var(--text);
  border-color: var(--accent-border);
}

.filter-btn.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

.filter-wrap {
  position: relative;
}

.filter-count {
  font-size: 11px;
  font-weight: 600;
}

.filter-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 40;
  min-width: 200px;
  padding: 7px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 11px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: 1px;
  animation: pp-pop 0.12s ease both;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 9px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13.5px;
  color: var(--text);
}

.filter-option:hover {
  background: var(--surface-2);
}

.filter-option input {
  width: 15px;
  height: 15px;
  accent-color: var(--accent);
  cursor: pointer;
}

.filter-option .mdi {
  font-size: 17px;
  line-height: 1;
  color: var(--muted);
}

.filter-hint {
  padding: 7px 9px 4px;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--faint);
  border-top: 1px solid var(--border);
  margin-top: 5px;
}

.mobile-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-filter-label {
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}

.mobile-filter-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Passen de drie knoppen niet naast elkaar, dan wikkelen ze naar een tweede rij. */
.mobile-filter-options .filter-btn {
  flex: 1 1 96px;
  padding: 0 9px;
}

.mobile-segments .filter-btn {
  width: 100%;
  justify-content: center;
  display: flex;
  align-items: center;
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

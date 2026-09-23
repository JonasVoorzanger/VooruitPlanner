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
          <button class="back-btn" @click="$router.push('/')">
            <span class="mdi mdi-arrow-left" aria-hidden="true"></span>
            <span>Wijzig vakken</span>
          </button>
          <div>
            <div class="context-title">{{ contextTitle }}</div>
            <div class="context-sub">{{ contextSub }}</div>
          </div>
        </div>
        <div class="topbar-actions">
          <button
            class="icon-btn"
            :class="{ wide: shareState }"
            :title="shareTitle"
            aria-label="Deel je planner-link"
            @click="share()"
          >
            <span class="mdi" :class="shareIcon" aria-hidden="true"></span>
            <!-- Zonder tekst zou je niet zien dat het kopieren gelukt is, dus
                 klapt de knop even open met de uitkomst erin. -->
            <span v-if="shareState" class="icon-btn-label">{{ shareLabel }}</span>
          </button>
          <button
            class="icon-btn"
            title="Exporteren naar A4"
            aria-label="Exporteren naar A4"
            @click="openExport()"
          >
            <span class="mdi mdi-printer-outline" aria-hidden="true"></span>
          </button>
          <span class="topbar-divider" aria-hidden="true"></span>
          <button
            class="icon-btn"
            title="Zie je iets wat anders of beter kan? Laat het ons weten!"
            aria-label="Feedback geven"
            @click="feedbackOpen = true"
          >
            <span class="mdi mdi-message-text-outline" aria-hidden="true"></span>
          </button>
          <button class="icon-btn" title="Uitleg over de planner" @click="introOpen = true">
            <span class="mdi mdi-help-circle-outline" aria-hidden="true"></span>
          </button>
          <button class="icon-btn" title="Thema" @click="toggleTheme">{{ themeIcon }}</button>
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
          <div v-if="view !== 'subject'" class="segment-group detail-group">
            <button
              v-for="option in detailOptions"
              :key="option.value"
              class="segment"
              :class="{ active: detailLevel === option.value }"
              :title="option.hint"
              :aria-label="option.hint"
              @click="detailLevel = option.value"
            >
              <span class="segment-content">
                <span class="mdi" :class="option.icon" aria-hidden="true"></span>
                <span class="segment-label">{{ option.label }}</span>
              </span>
            </button>
          </div>
          <div class="segment-group view-group">
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
              :class="{ warning: isFiltered }"
              :aria-expanded="filterOpen ? 'true' : 'false'"
              :title="filterTitle"
              @click="filterOpen = !filterOpen"
            >
              <span class="segment-content">
                <span
                  class="mdi"
                  :class="isFiltered ? 'mdi-filter-variant-remove' : 'mdi-filter-variant'"
                  aria-hidden="true"
                ></span>
                <span>Filter</span>
                <span v-if="isFiltered" class="filter-count pp-mono">
                  {{ activeFilterCount }}/{{ filterOptions.length }}
                </span>
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
              <button v-if="isFiltered" class="filter-reset" @click="resetFilters">
                <span class="mdi mdi-restore" aria-hidden="true"></span>
                <span>Alles weer tonen</span>
              </button>
              <div class="filter-hint">Overig zijn de schoolbrede activiteiten en vakanties.</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="menuOpen" class="mobile-menu-overlay" @click.self="closeMenu">
        <div class="mobile-menu-panel">
          <div class="mobile-menu-head">
            <div class="mobile-menu-title">Menu</div>
            <button class="close-btn" @click="closeMenu">
              <span class="mdi mdi-close" aria-hidden="true"></span>
              <span>Sluiten</span>
            </button>
          </div>

          <div class="mobile-menu-subjects pp-mono">{{ mobileSubjectLine }}</div>

          <div class="mobile-menu-actions">
            <button
              class="icon-btn"
              title="Feedback geven"
              aria-label="Feedback geven"
              @click="openFeedback()"
            >
              <span class="mdi mdi-message-text-outline" aria-hidden="true"></span>
            </button>
            <button class="icon-btn" title="Uitleg over de planner" @click="openIntro()">
              <span class="mdi mdi-help-circle-outline" aria-hidden="true"></span>
            </button>
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

            <div v-if="view === 'month'" class="range-label">{{ rangeLabel }}</div>

            <div class="segments mobile-segments">
              <div v-if="view !== 'subject'" class="segment-group detail-group">
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

              <div class="segment-group view-group">
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
                <div class="mobile-filter-label">
                  <span>Filter</span>
                  <span v-if="isFiltered" class="mobile-filter-warning">
                    <span class="mdi mdi-alert-outline" aria-hidden="true"></span>
                    <span>{{ activeFilterCount }}/{{ filterOptions.length }} — je ziet niet alles</span>
                  </span>
                </div>
                <div class="mobile-filter-options">
                  <label
                    v-for="option in filterOptions"
                    :key="`menu-filter-${option.value}`"
                    class="filter-option"
                  >
                    <input
                      type="checkbox"
                      :checked="filters[option.value]"
                      @change="toggleFilter(option.value)"
                    />
                    <span class="mdi" :class="option.icon" aria-hidden="true"></span>
                    <span>{{ option.label }}</span>
                  </label>
                  <button v-if="isFiltered" class="filter-reset" @click="resetFilters">
                    <span class="mdi mdi-restore" aria-hidden="true"></span>
                    <span>Alles weer tonen</span>
                  </button>
                  <div class="filter-hint">Overig zijn de schoolbrede activiteiten en vakanties.</div>
                </div>
              </div>

              <button class="filter-btn" @click="share()">
                <span class="segment-content">
                  <span class="mdi" :class="shareIcon" aria-hidden="true"></span>
                  <span>{{ shareLabel }}</span>
                </span>
              </button>

              <button class="filter-btn" @click="openExport(true)">
                <span class="segment-content">
                  <span class="mdi mdi-printer-outline" aria-hidden="true"></span>
                  <span>Exporteren</span>
                </span>
              </button>
            </div>

            <button class="menu-done" @click="closeMenu">Klaar</button>
          </div>
        </div>
      </div>

      <div class="view-area">
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

      <!-- <footer class="footer">
        <div class="footer-row">
          <div class="footer-brand">VooruitPlanner</div>
          <button class="footer-link" :title="linkCopied ? 'Gekopieerd' : 'Kopieer je link'" @click="copyLink">
            <span class="footer-link-label pp-mono">jouw link</span>
            <span class="footer-link-url pp-mono">{{ shareUrl }}</span>
            <span class="mdi" :class="linkCopied ? 'mdi-check' : 'mdi-content-copy'" aria-hidden="true"></span>
          </button>
        </div>
      </footer> -->

      <FeedbackBox :context="feedbackContext" />
    </div>

    <!-- Sluitteken onderaan de pagina, buiten de inhoudskolom zodat de lijnen
         de randen van het scherm halen. -->
    <div class="footer-mark" aria-hidden="true">
      <span class="mark-rule"></span>
      <!-- Het viewBox is bijgesneden tot de pootjes (x 42 en 1128, plus een halve
           lijndikte), zodat de lijnen er links en rechts strak tegenaan sluiten.
           De verticalen steken bewust door de horizontalen heen en eindigen in
           het niets, met ronde uiteinden. -->
      <svg class="mark-crest" viewBox="35 0 1100 310" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
          <path d="M42 303V93h138v119" />
          <path d="M180 145h170" />
          <path d="M350 212V15h90v115" />
          <path d="M440 52h290" />
          <path d="M730 130V15h90v197" />
          <path d="M820 145h170" />
          <path d="M990 212V93h138v210" />
          <path d="M471.5 303v-58a50 50 0 0 1 100 0v58" />
          <path d="M598.5 303v-58a50 50 0 0 1 100 0v58" />
        </g>
      </svg>
      <span class="mark-rule"></span>
    </div>

    <IntroTour v-if="introOpen" @close="introOpen = false" />
    <FeedbackDialog
      v-if="feedbackOpen"
      :context="feedbackContext"
      @close="feedbackOpen = false"
    />

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
      :initial-course="subjectCourse"
      :subjects-map="subjectsMap"
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
      :course="exportSettings.course"
    />
  </div>
</template>

<script>
import IntroTour from '../components/IntroTour.vue'
import FeedbackBox from '../components/FeedbackBox.vue'
import FeedbackDialog from '../components/FeedbackDialog.vue'
import EventModal from '../components/planner/EventModal.vue'
import ExportDialog from '../components/planner/ExportDialog.vue'
import MonthGrid from '../components/planner/MonthGrid.vue'
import PrintDocument from '../components/planner/PrintDocument.vue'
import SubjectView from '../components/planner/SubjectView.vue'
import WeekList from '../components/planner/WeekList.vue'
import { useTheme } from '../composables/useTheme'
import { useSpreadsheetStore } from '../stores/spreadsheet'
import {
  DEFAULT_FILTERS,
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
    IntroTour,
    FeedbackBox,
    FeedbackDialog,
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
      detailLevel: localStorage.getItem('plannerDetailLevel') === 'full' ? 'full' : 'compact',
      filters: loadFilters(),
      filterOpen: false,
      shareState: '',
      linkCopied: false,
      introOpen: false,
      feedbackOpen: false,
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
        {
          value: 'compact',
          label: 'Compact',
          hint: 'Compact — alleen de titels',
          icon: 'mdi-magnify-minus-outline',
        },
        {
          value: 'full',
          label: 'Uitgebreid',
          hint: 'Uitgebreid — met de toelichting erbij',
          icon: 'mdi-magnify-plus-outline',
        },
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
    filterTitle() {
      return this.isFiltered
        ? 'Let op: er staat een filter aan, je ziet niet alles'
        : 'Kies welke soorten items je ziet'
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
    // Geen namen of vakkenlijst: alleen waar de leerling stond toen hij schreef.
    feedbackContext() {
      return {
        view: this.view,
        year: this.year,
        course_count: this.courses.length,
      }
    },
    shareLabel() {
      if (this.shareState === 'copied') {
        return 'Link gekopieerd'
      }
      if (this.shareState === 'failed') {
        return 'Kopiëren mislukt'
      }
      return 'Delen'
    },
    shareIcon() {
      if (this.shareState === 'copied') {
        return 'mdi-check'
      }
      return 'mdi-export-variant'
    },
    // De eigen link van deze leerling, zoals hij ook te delen is.
    shareUrl() {
      return `${window.location.host}/#/jaar/${this.year}/${this.courses.join('.')}`
    },
    shareTitle() {
      return 'Deel je eigen planner-link — of zet de planner op je beginscherm'
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
    window.clearTimeout(this.shareTimer)
    window.clearTimeout(this.copyTimer)
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
    // Het deelvenster van het toestel zelf; daar zit op mobiel ook "Zet op
    // beginscherm" in. Zonder die ondersteuning valt hij terug op kopiëren.
    async share() {
      const url = window.location.href
      const shareData = {
        title: 'VooruitPlanner',
        text: `Planner voor klas ${this.year}: ${this.courses.join(', ')}`,
        url,
      }

      if (navigator.share) {
        try {
          await navigator.share(shareData)
          this.closeMenu()
          return
        } catch (error) {
          // Geannuleerd door de gebruiker: verder niets doen.
          if (error && error.name === 'AbortError') {
            return
          }
        }
      }

      try {
        await navigator.clipboard.writeText(url)
        this.flashShareState('copied')
      } catch {
        this.flashShareState('failed')
      }
    },
    async copyLink() {
      try {
        await navigator.clipboard.writeText(window.location.href)
        this.linkCopied = true
        window.clearTimeout(this.copyTimer)
        this.copyTimer = window.setTimeout(() => {
          this.linkCopied = false
        }, 2200)
      } catch {
        // Klembord niet beschikbaar; de link staat al leesbaar in beeld.
      }
    },
    flashShareState(state) {
      this.shareState = state
      window.clearTimeout(this.shareTimer)
      this.shareTimer = window.setTimeout(() => {
        this.shareState = ''
      }, 2200)
    },
    openIntro() {
      this.introOpen = true
      this.closeMenu()
    },
    openFeedback() {
      this.feedbackOpen = true
      this.closeMenu()
    },
    toggleFilter(category) {
      this.filters = { ...this.filters, [category]: !this.filters[category] }
    },
    resetFilters() {
      this.filters = { ...DEFAULT_FILTERS }
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
  padding: 0 20px 0;
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
  gap: 14px;
  min-width: 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 13px 0 10px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
}

.back-btn:hover {
  border-color: var(--accent-border);
  color: var(--accent);
}

.back-btn .mdi {
  font-size: 17px;
  line-height: 1;
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

.icon-btn .mdi {
  font-size: 19px;
  line-height: 1;
}

/* Alleen zolang er iets te melden valt over het delen. */
.icon-btn.wide {
  width: auto;
  gap: 7px;
  padding: 0 11px;
  color: var(--text);
  border-color: var(--accent-border);
}

.icon-btn-label {
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
}

.topbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border);
  margin: 0 2px;
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
  padding: 10px 0 12px;
  border-top: 1px solid var(--border);
}

.view-area {
  padding-top: 18px;
}

.footer {
  margin-top: 44px;
}

.footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding-bottom: 18px;
}

.footer-brand {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  min-width: 0;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
}

.footer-link:hover {
  border-color: var(--accent-border);
  color: var(--text);
}

.footer-link-label {
  color: var(--faint);
  flex-shrink: 0;
}

.footer-link-url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer-link .mdi {
  font-size: 15px;
  line-height: 1;
  flex-shrink: 0;
}

/* Het sluitteken: een doorlopende lijn met het silhouet in het midden. Staat
   buiten .container, zodat de lijnen tot de schermranden lopen. */
.footer-mark {
  display: flex;
  align-items: flex-end;
  color: var(--accent);
  margin-top: 40px;
  padding-bottom: 28px;
}

/* 140px breed schaalt de lijndikte van 14 naar ~1,8px; de aanlopers zijn even
   dik en eindigen op dezelfde hoogte als de pootjes. */
.mark-rule {
  flex: 1;
  height: 1.8px;
  background: currentColor;
}

.mark-crest {
  width: 140px;
  height: 39.5px;
  flex-shrink: 0;
}

@media (max-width: 760px) {
  .footer {
    margin-top: 32px;
  }

  .mark-rule {
    height: 1.4px;
  }

  .mark-crest {
    width: 110px;
    height: 31px;
  }
}

/* Blijft tijdens het scrollen bovenaan staan, zodat de knoppen altijd
   bereikbaar zijn. */
@media (min-width: 761px) {
  .controls {
    position: sticky;
    top: 0;
    z-index: 30;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }
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

/* Alleen op een breed scherm (.controls is op mobiel verborgen). De weergave
   is het eerste wat mensen willen omzetten, maar het viel niet op dat het een
   schakelaar was: de actieve weergave krijgt daarom het accent, en de andere
   twee lichten op zodra de muis erover gaat. */
.controls .segment {
  transition: background 0.12s ease, color 0.12s ease;
}

.controls .segment:not(.active):not(:disabled):hover {
  background: var(--surface);
  color: var(--text);
}

.controls .view-group {
  border-color: var(--accent-border);
}

/* Compact/Uitgebreid trok in de balk te veel aandacht voor iets wat je zelden
   omzet: op een breed scherm blijft alleen het loepje over, met de uitleg in
   de tooltip. */
.controls .detail-group .segment-label {
  display: none;
}

.controls .detail-group .segment {
  padding: 6px 9px;
}

.controls .detail-group .segment-content .mdi {
  font-size: 18px;
}

.controls .view-group .segment.active {
  background: var(--accent);
  color: var(--on-accent);
  box-shadow: none;
}

.controls .view-group .segment:not(.active):hover {
  color: var(--accent);
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

/* Staat er een filter aan, dan is de knop geel: je ziet niet alles, en dat
   moet je zien zonder het menu open te klappen. */
.filter-btn.warning {
  border-color: var(--warn);
  background: var(--warn-soft);
  color: var(--warn);
  font-weight: 600;
}

.filter-btn.warning:hover {
  border-color: var(--warn);
  color: var(--warn);
}

.filter-reset {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  margin-top: 4px;
  padding: 8px 9px;
  border: none;
  border-radius: 8px;
  background: var(--warn-soft);
  color: var(--warn);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}

.filter-reset:hover {
  background: color-mix(in oklab, var(--warn-soft) 80%, var(--warn) 20%);
}

.filter-reset .mdi {
  font-size: 17px;
  line-height: 1;
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
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}

/* Het menu heeft geen filterknop om geel te kleuren, dus staat de waarschuwing
   hier boven de vinkjes. */
.mobile-filter-warning {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--warn-soft);
  color: var(--warn);
  text-transform: none;
  letter-spacing: 0;
}

.mobile-filter-warning .mdi {
  font-size: 14px;
  line-height: 1;
}

/* Dezelfde vinkjes als in het uitklapmenu op desktop, maar onder elkaar en
   met raakvlakken die met een duim te raken zijn. */
.mobile-filter-options {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--surface);
}

.mobile-filter-options .filter-option {
  padding: 11px 10px;
  font-size: 14px;
}

.mobile-filter-options .filter-option input {
  width: 18px;
  height: 18px;
}

.mobile-filter-options .filter-hint {
  padding: 8px 10px 4px;
}

.mobile-filter-options .filter-reset {
  padding: 11px 10px;
  font-size: 14px;
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

.close-btn {
  height: 36px;
  padding: 0 13px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.close-btn:hover {
  border-color: var(--accent-border);
}

.menu-done {
  height: 46px;
  border-radius: 11px;
  border: none;
  background: var(--accent);
  color: var(--on-accent);
  cursor: pointer;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  margin-top: 4px;
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

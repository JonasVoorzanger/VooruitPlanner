<template>
  <div class="screen">
    <IntroTour v-if="introOpen" :dismissible="false" @close="introOpen = false" />

    <div class="panel">
      <div class="brand">
        <img v-if="school.logoUrl" class="logo-image" :src="school.logoUrl" alt="" />
        <div v-else class="logo pp-mono">{{ schoolInitial }}</div>
        <div>
          <div class="brand-name">{{ school.name }}</div>
          <router-link class="brand-sub" to="/">VooruitPlanner · andere school</router-link>
        </div>
      </div>

      <!-- Stap voor stap: de volgende stap verschijnt pas als de vorige klaar is. -->
      <section class="step">
        <h2 class="step-head"><span class="step-number">1</span> Kies je leerjaar</h2>
        <div class="chip-row years">
          <button
            v-for="option in plannerStore.years"
            :key="option"
            class="year-chip"
            :class="{ active: year === option }"
            @click="selectYear(option)"
          >
            {{ option }}
          </button>
        </div>
      </section>

      <section v-if="year" class="step">
        <h2 class="step-head"><span class="step-number">2</span> Kies je profiel</h2>
        <div class="chip-row profiles">
          <button
            v-for="profile in profiles"
            :key="profile.id"
            class="profile-chip"
            :class="{ active: activeProfileId === profile.id }"
            :title="profile.name"
            @click="applyProfile(profile)"
          >
            {{ profile.label }}
          </button>
        </div>
        <button v-if="!showSubjectStep" class="skip-profile" @click="profileSkipped = true">
          Ik kies mijn vakken liever zelf
        </button>
      </section>

      <section v-if="showSubjectStep" class="step">
        <h2 class="step-head">
          <span class="step-number">3</span> Selecteer eventueel je andere (keuze)vakken
        </h2>
        <div class="section-head">
          <div class="count pp-mono">{{ courses.length }} gekozen</div>
          <button class="toggle-all pp-mono" @click="toggleAllCourses">
            {{ allCoursesSelected ? 'Deselecteer alles' : 'Selecteer alles' }}
          </button>
        </div>
        <div class="chip-row subjects">
          <button
            v-for="subject in selectableSubjects"
            :key="subject.abbreviation"
            class="course-chip"
            :class="{ active: courses.includes(subject.abbreviation) }"
            :aria-pressed="courses.includes(subject.abbreviation) ? 'true' : 'false'"
            :title="subject.full_name"
            @click="toggleCourse(subject.abbreviation)"
          >
            <span class="box" aria-hidden="true">
              <span v-if="courses.includes(subject.abbreviation)" class="mdi mdi-check"></span>
            </span>
            <span class="abbr pp-mono">{{ subject.abbreviation }}</span>&nbsp;{{ subject.full_name }}
          </button>
        </div>

        <!-- Vakken zonder planner staan uit de weg, maar blijven wel op te vragen. -->
        <div v-if="unavailableCount" class="unavailable-block">
          <button class="toggle-unavailable" @click="showUnavailable = !showUnavailable">
            <span class="mdi chevron" :class="showUnavailable ? 'mdi-chevron-down' : 'mdi-chevron-right'"></span>
            {{ showUnavailable ? 'Verberg' : 'Toon' }} vakken zonder planner ({{ unavailableCount }})
          </button>

          <template v-if="showUnavailable">
            <div class="chip-row unavailable">
              <span v-for="subject in unavailableSubjects" :key="subject.abbreviation" class="course-chip inactive">
                <span class="abbr pp-mono">{{ subject.abbreviation }}</span>&nbsp;{{ subject.full_name }}
              </span>
            </div>
            <p class="subject-hint">
              Voor deze vakken is nog geen planner geüpload voor leerjaar {{ year }}, dus je kunt ze nog niet kiezen.
            </p>
          </template>
        </div>
      </section>

      <button class="confirm" :disabled="!canConfirm" @click="confirm">
        <span>Planner openen</span>
        <span class="mdi mdi-arrow-right" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</template>

<script>
import IntroTour, { introHidden } from '../components/IntroTour.vue'
import { availableProfileCourses } from '../data/profiles'
import { usePlannerStore } from '../stores/planner'
import { coursesWithItems, loadSelection, saveSelection } from '../utils/plannerModel'

export default {
  name: 'OnboardingView',
  components: {
    IntroTour,
  },
  data() {
    const plannerStore = usePlannerStore()
    const selection = loadSelection(plannerStore.schoolId, plannerStore.years)
    return {
      plannerStore,
      year: selection.year,
      courses: [...selection.courses],
      showUnavailable: false,
      introOpen: false,
      // Wie geen profiel gebruikt, kiest zijn vakken zelf; stap 3 komt dan ook
      // zonder profielkeuze tevoorschijn.
      profileSkipped: selection.courses.length > 0,
    }
  },
  computed: {
    school() {
      return this.plannerStore.school
    },
    schoolInitial() {
      return String(this.school.name || '?').trim().charAt(0).toUpperCase()
    },
    profiles() {
      return this.plannerStore.profiles
    },
    subjects() {
      return this.plannerStore.subjects
    },
    // Zonder gekozen leerjaar weten we nog niet welke planners er zijn; dan is
    // alles nog kiesbaar.
    availableCourses() {
      if (!this.year) {
        return null
      }
      return coursesWithItems(this.plannerStore.events, this.year)
    },
    selectableSubjects() {
      return this.subjects.filter((subject) => this.isAvailable(subject.abbreviation))
    },
    showSubjectStep() {
      return Boolean(this.year) && (this.profileSkipped || Boolean(this.activeProfileId) || this.courses.length > 0)
    },
    // Alleen verplichte vakken zijn het melden waard: een keuzevak dat je toch
    // niet volgt hoeft niet op te vallen omdat er geen planner voor is.
    unavailableSubjects() {
      return this.subjects.filter(
        (subject) => !this.isAvailable(subject.abbreviation) && this.isRequired(subject),
      )
    },
    unavailableCount() {
      return this.unavailableSubjects.length
    },
    // Highlights the profile whose vakkenpakket matches the current selection.
    activeProfileId() {
      if (!this.year || !this.courses.length) {
        return null
      }

      const selected = [...this.courses].sort().join('.')
      const match = this.profiles.find(
        (profile) =>
          availableProfileCourses(profile, this.year, this.selectableSubjects).sort().join('.') === selected,
      )
      return match ? match.id : null
    },
    allCoursesSelected() {
      return this.selectableSubjects.length > 0 && this.courses.length === this.selectableSubjects.length
    },
    canConfirm() {
      return this.plannerStore.years.includes(this.year) && this.courses.length > 0
    },
    plannerPath() {
      if (!this.canConfirm) {
        return ''
      }
      return `${this.plannerStore.basePath}/jaar/${this.year}/${this.courses.join('.')}`
    },
  },
  // De uitleg hoort alleen bij het openen van de site zelf of het kiezen van
  // een school. Navigeren binnen de app naar dit scherm — bijvoorbeeld via
  // "Wijzig vakken" — laat hem met rust, en een directe link naar een planner
  // komt hier sowieso niet langs.
  beforeRouteEnter(to, from, next) {
    const isFreshVisit = from.matched.length === 0 || from.name === 'schoolSearch'
    next((vm) => {
      if (isFreshVisit && !introHidden()) {
        vm.introOpen = true
      }
    })
  },
  watch: {
    // Vakken zonder planner voor het nieuwe leerjaar vallen uit de keuze.
    year() {
      this.courses = this.courses.filter((course) => this.isAvailable(course))
    },
  },
  methods: {
    selectYear(year) {
      this.year = year
    },
    isAvailable(abbreviation) {
      return !this.availableCourses || this.availableCourses.has(abbreviation)
    },
    // Of het vak verplicht is in dit leerjaar. Weten we dat niet, dan tonen we
    // het liever te veel dan te weinig.
    isRequired(subject) {
      const flags = subject.required
      if (!flags || !(this.year in flags)) {
        return true
      }
      return Boolean(flags[this.year])
    },
    toggleCourse(abbreviation) {
      if (!this.isAvailable(abbreviation)) {
        return
      }
      if (this.courses.includes(abbreviation)) {
        this.courses = this.courses.filter((course) => course !== abbreviation)
      } else {
        this.courses = [...this.courses, abbreviation]
      }
    },
    applyProfile(profile) {
      if (!this.year) {
        return
      }

      const profileSelection = availableProfileCourses(profile, this.year, this.selectableSubjects)
      // Klikken op het actieve profiel maakt de keuze weer leeg.
      this.courses = this.activeProfileId === profile.id ? [] : profileSelection
    },
    toggleAllCourses() {
      if (this.allCoursesSelected) {
        this.courses = []
      } else {
        this.courses = this.selectableSubjects.map((subject) => subject.abbreviation)
      }
    },
    confirm() {
      if (!this.canConfirm) {
        return
      }
      saveSelection(this.plannerStore.schoolId, { year: this.year, courses: this.courses })
      this.$router.push(this.plannerPath)
    },
  },
}
</script>

<style scoped>
.screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
}

.panel {
  width: 100%;
  max-width: 720px;
  animation: pp-fade 0.4s ease both;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 26px;
}

.logo {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-weight: 700;
  font-size: 15px;
}

.logo-image {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  object-fit: contain;
}

.brand-name {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: -0.01em;
}

.brand-sub {
  display: block;
  font-size: 12px;
  color: var(--faint);
  text-decoration: none;
}

.brand-sub:hover {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.heading {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 26px;
}

.step {
  margin-bottom: 28px;
  animation: pp-fade 0.25s ease both;
}

.step-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0 0 12px;
}

.step-number {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.skip-profile {
  margin-top: 12px;
  border: none;
  background: none;
  padding: 0;
  color: var(--muted);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.skip-profile:hover {
  color: var(--accent);
}

/* Een vinkvakje maakt zichtbaar dat je vakken aan- en uitzet. */
.box {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border-radius: 4px;
  border: 1.5px solid var(--border-strong);
  background: var(--surface);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--on-accent);
  font-size: 13px;
  line-height: 1;
}

.course-chip.active .box {
  background: var(--accent);
  border-color: var(--accent);
}


.section-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}



.count {
  font-size: 12.5px;
  color: var(--faint);
}

.toggle-all {
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--muted);
  border-radius: 7px;
  height: 28px;
  padding: 0 9px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11.5px;
}

.toggle-all:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip-row.subjects {
  margin-bottom: 16px;
}

.subject-hint {
  font-size: 12.5px;
  color: var(--faint);
  margin: 10px 0 0;
  line-height: 1.4;
}

.unavailable-block {
  margin-bottom: 4px;
}

/* Zachte waarschuwingskleur: verplichte vakken zonder planner mogen opvallen,
   maar niet alarmeren. */
.toggle-unavailable {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 11px;
  border-radius: 8px;
  border: 1px solid color-mix(in oklab, var(--exam) 40%, var(--border));
  background: var(--exam-soft);
  color: color-mix(in oklab, var(--exam) 55%, var(--text));
  cursor: pointer;
  font-family: inherit;
  font-size: 12.5px;
}

.toggle-unavailable:hover {
  border-color: var(--exam);
  color: color-mix(in oklab, var(--exam) 25%, var(--text));
}

.toggle-unavailable .chevron {
  font-size: 16px;
  line-height: 1;
}

.chip-row.unavailable {
  margin-top: 12px;
}

/* Geen knop maar een label: er valt niets te kiezen. */
.course-chip.inactive {
  color: var(--faint);
  background: var(--surface-2);
  border-style: dashed;
  cursor: default;
}

.course-chip.inactive .abbr {
  color: var(--faint);
}


.profile-chip {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
}

.profile-chip:hover {
  border-color: var(--accent-border);
}

.profile-chip.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}


.year-chip {
  min-width: 44px;
  height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
}

.year-chip.active {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--on-accent);
}

.course-chip {
  display: inline-flex;
  align-items: center;
  text-align: left;
  padding: 8px 13px;
  border-radius: 9px;
  border: 1px solid var(--border);
  box-sizing: border-box;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
  transition: all 0.1s;
}

.course-chip .abbr {
  font-weight: 600;
}

.course-chip.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 500;
}

.confirm {
  width: 100%;
  height: 48px;
  border-radius: 11px;
  border: none;
  background: var(--accent);
  color: var(--on-accent);
  cursor: pointer;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
}

.confirm .mdi {
  font-size: 20px;
  line-height: 1;
  transition: transform 0.15s ease;
}

.confirm:not(:disabled):hover .mdi {
  transform: translateX(3px);
}

@media (prefers-reduced-motion: reduce) {
  .confirm .mdi {
    transition: none;
  }

  .confirm:not(:disabled):hover .mdi {
    transform: none;
  }
}

.confirm:disabled {
  background: var(--border-strong);
  color: var(--faint);
  cursor: not-allowed;
}

</style>

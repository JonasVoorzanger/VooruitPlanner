<template>
  <div class="screen">
    <div class="panel">
      <div class="brand">
        <div class="logo pp-mono">P</div>
        <div class="brand-name">PeriodePlanner</div>
      </div>

      <h1 class="heading">Stel je weergave in</h1>
      <p class="intro">
        Kies je leerjaar en de vakken die je wilt zien. Daarna opent de planner meteen op jouw eigen link —
        leerling, mentor of docent.
      </p>

      <div class="section-label">Leerjaar</div>
      <div class="chip-row years">
        <button
          v-for="option in [4, 5]"
          :key="option"
          class="year-chip"
          :class="{ active: year === option }"
          @click="year = option"
        >
          {{ option }}
        </button>
      </div>

      <div class="section-label">Profiel</div>
      <p v-if="!year" class="profile-hint">Kies eerst een leerjaar om een profiel te gebruiken.</p>
      <div class="chip-row profiles">
        <button
          v-for="profile in profiles"
          :key="profile.id"
          class="profile-chip"
          :class="{ active: activeProfileId === profile.id }"
          :disabled="!year"
          :title="profile.name"
          @click="applyProfile(profile)"
        >
          {{ profile.label }}
        </button>
      </div>

      <div class="section-head">
        <div class="section-label">Vakken</div>
        <div class="section-actions">
          <button class="toggle-all pp-mono" @click="toggleAllCourses">
            {{ allCoursesSelected ? 'Deselecteer alles' : 'Selecteer alles' }}
          </button>
          <div class="count pp-mono">{{ courses.length }} gekozen</div>
        </div>
      </div>
      <p v-if="!year" class="subject-hint">Kies eerst een leerjaar om te zien welke vakken een planner hebben.</p>
      <div class="chip-row subjects">
        <button
          v-for="subject in selectableSubjects"
          :key="subject.abbreviation"
          class="course-chip"
          :class="{ active: courses.includes(subject.abbreviation) }"
          :title="subject.full_name"
          @click="toggleCourse(subject.abbreviation)"
        >
          <span class="abbr pp-mono">{{ subject.abbreviation }}</span>&nbsp;{{ subject.full_name }}
        </button>
      </div>

      <!-- Vakken zonder planner staan uit de weg, maar blijven wel op te vragen. -->
      <div v-if="unavailableCount" class="unavailable-block">
        <button class="toggle-unavailable" @click="showUnavailable = !showUnavailable">
          <span class="chevron">{{ showUnavailable ? '▾' : '▸' }}</span>
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

      <button class="confirm" :disabled="!canConfirm" @click="confirm">Planner openen</button>

      <div class="share">
        <span class="share-label pp-mono">jouw link</span>
        <span class="share-url pp-mono">{{ shareUrl }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { availableProfileCourses, PROFILES } from '../data/profiles'
import { useSpreadsheetStore } from '../stores/spreadsheet'
import { coursesWithItems, loadSelection, saveSelection } from '../utils/plannerModel'

export default {
  name: 'OnboardingView',
  data() {
    const selection = loadSelection()
    return {
      spreadsheetStore: useSpreadsheetStore(),
      year: selection.year,
      courses: [...selection.courses],
      profiles: PROFILES,
      showUnavailable: false,
    }
  },
  computed: {
    subjects() {
      return this.spreadsheetStore.subjects
    },
    // Zonder gekozen leerjaar weten we nog niet welke planners er zijn; dan is
    // alles nog kiesbaar.
    availableCourses() {
      if (!this.year) {
        return null
      }
      return coursesWithItems(this.spreadsheetStore.events, this.year)
    },
    selectableSubjects() {
      return this.subjects.filter((subject) => this.isAvailable(subject.abbreviation))
    },
    unavailableSubjects() {
      return this.subjects.filter((subject) => !this.isAvailable(subject.abbreviation))
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
      return [4, 5].includes(this.year) && this.courses.length > 0
    },
    plannerPath() {
      if (!this.canConfirm) {
        return ''
      }
      return `/jaar/${this.year}/${this.courses.join('.')}`
    },
    shareUrl() {
      if (!this.plannerPath) {
        return 'kies leerjaar en vakken'
      }
      return `${window.location.host}/#${this.plannerPath}`
    },
  },
  watch: {
    // Vakken zonder planner voor het nieuwe leerjaar vallen uit de keuze.
    year() {
      this.courses = this.courses.filter((course) => this.isAvailable(course))
    },
  },
  methods: {
    isAvailable(abbreviation) {
      return !this.availableCourses || this.availableCourses.has(abbreviation)
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
      saveSelection({ year: this.year, courses: this.courses })
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

.brand-name {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: -0.01em;
}

.heading {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 6px;
}

.intro {
  color: var(--muted);
  font-size: 14.5px;
  margin: 0 0 26px;
}

.section-label {
  font-size: 12.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin-bottom: 10px;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-head .section-label {
  margin-bottom: 0;
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

.chip-row.years {
  margin-bottom: 24px;
}

.chip-row.profiles {
  margin-bottom: 24px;
}

.chip-row.subjects {
  margin-bottom: 26px;
}

.subject-hint {
  font-size: 12.5px;
  color: var(--faint);
  margin: 10px 0 0;
  line-height: 1.4;
}

.unavailable-block {
  margin-top: -14px;
  margin-bottom: 26px;
}

.toggle-unavailable {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 11px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--muted);
  cursor: pointer;
  font-family: inherit;
  font-size: 12.5px;
}

.toggle-unavailable:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.toggle-unavailable .chevron {
  font-size: 11px;
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

.profile-hint {
  font-size: 12.5px;
  color: var(--faint);
  margin: -4px 0 10px;
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

.profile-chip:hover:not(:disabled) {
  border-color: var(--accent-border);
}

.profile-chip.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.profile-chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
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
}

.confirm:disabled {
  background: var(--border-strong);
  color: var(--faint);
  cursor: not-allowed;
}

.share {
  margin-top: 16px;
  font-size: 12.5px;
  color: var(--faint);
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.share-label {
  color: var(--muted);
  flex-shrink: 0;
}

.share-url {
  color: var(--muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

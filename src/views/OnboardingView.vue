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
          v-for="option in [1, 2, 3, 4, 5, 6]"
          :key="option"
          class="year-chip"
          :class="{ active: year === option }"
          @click="year = option"
        >
          {{ option }}
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
      <div class="chip-row subjects">
        <button
          v-for="subject in subjects"
          :key="subject.abbreviation"
          class="course-chip"
          :class="{ active: courses.includes(subject.abbreviation) }"
          @click="toggleCourse(subject.abbreviation)"
        >
          <span class="abbr pp-mono">{{ subject.abbreviation }}</span>&nbsp;{{ subject.full_name }}
        </button>
      </div>

      <button class="confirm" :disabled="!courses.length" @click="confirm">Planner openen</button>

      <div class="share">
        <span class="share-label pp-mono">jouw link</span>
        <span class="share-url pp-mono">{{ shareUrl }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { useSpreadsheetStore } from '../stores/spreadsheet'
import { loadSelection, saveSelection } from '../utils/plannerModel'

export default {
  name: 'OnboardingView',
  data() {
    const selection = loadSelection()
    return {
      spreadsheetStore: useSpreadsheetStore(),
      year: selection.year,
      courses: [...selection.courses],
    }
  },
  computed: {
    subjects() {
      return this.spreadsheetStore.subjects
    },
    allCoursesSelected() {
      return this.subjects.length > 0 && this.courses.length === this.subjects.length
    },
    plannerPath() {
      return `/jaar/${this.year}/${this.courses.join('.')}`
    },
    shareUrl() {
      return `${window.location.host}/#${this.plannerPath}`
    },
  },
  methods: {
    toggleCourse(abbreviation) {
      if (this.courses.includes(abbreviation)) {
        this.courses = this.courses.filter((course) => course !== abbreviation)
      } else {
        this.courses = [...this.courses, abbreviation]
      }
    },
    toggleAllCourses() {
      if (this.allCoursesSelected) {
        this.courses = []
      } else {
        this.courses = this.subjects.map((subject) => subject.abbreviation)
      }
    },
    confirm() {
      if (!this.courses.length) {
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
  max-width: 560px;
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
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--on-accent);
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

.chip-row.subjects {
  margin-bottom: 26px;
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

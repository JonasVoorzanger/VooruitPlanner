import { defineStore } from 'pinia'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { PROFILES } from '../data/profiles'

// Firestore slaat alleen gevulde velden op; de planner verwacht ze allemaal.
const ITEM_DEFAULTS = {
  label: '',
  description: '',
  date: '',
  end_date: '',
  weight: '',
  cal_year: '',
  cal_week_number: '',
}

function parseDate(value) {
  if (!value) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`)
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

function sortBySubjectThenLabel(a, b) {
  return `${a.subject_abbreviation} ${a.label}`.localeCompare(`${b.subject_abbreviation} ${b.label}`)
}

// Het lopende verzoek van loadSchool, zodat gelijktijdige aanroepen wachten op
// hetzelfde verzoek.
let schoolRequest = null

// Een school, het huidige schooljaar en de vakken die tot nu toe nodig waren.
// Vakken laden we per stuk: de planner van een leerling heeft alleen zijn eigen
// vakken nodig.
export const usePlannerStore = defineStore('planner', {
  state: () => ({
    // 'idle' | 'loading' | 'ready' | 'not-found' | 'error'
    status: 'idle',
    slug: null,
    schoolId: null,
    school: null,
    schoolYear: null,
    weeks: [],
    schoolWide: [],
    // afkorting → { fullName, profiles, required, items }
    subjectDocs: {},
    allSubjectsLoaded: false,
  }),
  getters: {
    subjects: (state) =>
      Object.entries(state.subjectDocs)
        .map(([abbreviation, subject]) => ({
          abbreviation,
          full_name: subject.fullName || abbreviation,
          profiles: subject.profiles || {},
          required: subject.required || {},
        }))
        .sort((a, b) => a.abbreviation.localeCompare(b.abbreviation)),
    // Alle items in de vorm van de oude `events`-tab: schoolbrede items en de
    // items van de geladen vakken.
    events: (state) => [
      ...state.schoolWide.map((item) => ({ ...ITEM_DEFAULTS, subject_abbreviation: '', year: '', ...item })),
      ...Object.entries(state.subjectDocs).flatMap(([abbreviation, subject]) =>
        (subject.items || []).map((item) => ({ ...ITEM_DEFAULTS, ...item, subject_abbreviation: abbreviation })),
      ),
    ],
    profiles: (state) =>
      (state.school?.profiles?.length ? state.school.profiles : PROFILES).map((profile) => ({
        ...profile,
        id: profile.key.toLowerCase(),
      })),
    getEventsByWeek() {
      return (week, years = []) => {
        const weekStart = parseDate(week.start_date)
        const weekEnd = parseDate(week.end_date)

        return this.events.filter((event) => {
          if (String(event.type || '').trim().toLowerCase() !== 'school-wide') {
            return false
          }

          const eventStart = parseDate(event.date)
          const eventEnd = parseDate(event.end_date) || eventStart

          if (!eventStart || !weekStart || !weekEnd) {
            return false
          }

          if (eventEnd < weekStart || eventStart > weekEnd) {
            return false
          }

          if (!years.length) {
            return true
          }

          return years.some((year) => event[`year_${year}`])
        })
      }
    },
    getSubjectItemsByWeekAndYear() {
      return (weekNumber, years = [], subjects = [], calYear = null) =>
        this.events
          .filter((item) => String(item.type || '').trim().toLowerCase() !== 'school-wide')
          .filter((item) => Number(item.cal_week_number ?? item.week_number) === Number(weekNumber))
          .filter((item) => {
            if (!Number.isFinite(Number(calYear))) {
              return true
            }
            const itemCalYear = Number(item.cal_year)
            // Backward compatibility for old entries without cal_year.
            if (!Number.isFinite(itemCalYear)) {
              return true
            }
            return itemCalYear === Number(calYear)
          })
          .filter((item) => !years.length || years.includes(Number(item.year)))
          .filter((item) => !subjects.length || subjects.includes(item.subject_abbreviation))
          .sort(sortBySubjectThenLabel)
    },
  },
  actions: {
    yearPath() {
      return `schools/${this.schoolId}/years/${this.schoolYear}`
    },

    // Zoekt de school bij een adres: eerst als slug, dan als school-id (het
    // adres van een school die nog niet is goedgekeurd). Laadt ook het jaar.
    async loadSchool(slug) {
      if (this.slug === slug && ['loading', 'ready', 'not-found'].includes(this.status)) {
        return schoolRequest
      }

      this.$reset()
      this.slug = slug
      this.status = 'loading'
      schoolRequest = (async () => {
        try {
          const slugSnap = await getDoc(doc(db, 'slugs', slug))
          const schoolId = slugSnap.exists() ? slugSnap.data().schoolId : slug
          const schoolSnap = await getDoc(doc(db, 'schools', schoolId)).catch((error) => {
            // Een onbekend of niet-goedgekeurd id mag niet gelezen worden.
            if (error.code === 'permission-denied') {
              return null
            }
            throw error
          })

          if (!schoolSnap || !schoolSnap.exists()) {
            this.status = 'not-found'
            return
          }

          this.schoolId = schoolId
          this.school = schoolSnap.data()
          this.schoolYear = this.school.currentSchoolYear

          const yearSnap = await getDoc(doc(db, this.yearPath()))
          const year = yearSnap.exists() ? yearSnap.data() : {}
          this.weeks = year.weeks || []
          this.schoolWide = year.schoolWide || []
          this.status = 'ready'
        } catch (error) {
          console.error(error)
          this.status = 'error'
        }
      })()
      return schoolRequest
    },

    // Laadt de vakken die nog niet geladen zijn; zonder lijst alle vakken.
    async loadSubjects(abbreviations = null) {
      if (this.status !== 'ready' || this.allSubjectsLoaded) {
        return
      }

      try {
        if (!abbreviations) {
          const snapshot = await getDocs(collection(db, this.yearPath(), 'subjects'))
          const subjectDocs = {}
          snapshot.forEach((subjectSnap) => {
            subjectDocs[subjectSnap.id] = subjectSnap.data()
          })
          this.subjectDocs = subjectDocs
          this.allSubjectsLoaded = true
          return
        }

        const missing = abbreviations.filter((abbreviation) => !this.subjectDocs[abbreviation])
        const snapshots = await Promise.all(
          missing.map((abbreviation) => getDoc(doc(db, this.yearPath(), 'subjects', abbreviation))),
        )
        snapshots
          .filter((subjectSnap) => subjectSnap.exists())
          .forEach((subjectSnap) => {
            this.subjectDocs[subjectSnap.id] = subjectSnap.data()
          })
      } catch (error) {
        console.error(error)
        this.status = 'error'
      }
    },
  },
})

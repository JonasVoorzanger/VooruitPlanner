import { defineStore } from 'pinia'
import bundledData from '../../scripts/migration/spreadsheet.json'

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

export const useSpreadsheetStore = defineStore('spreadsheet', {
  state: () => ({
    weeks: bundledData.weeks || [],
    events: bundledData.events || [],
    subjects: bundledData.subjects || [],
  }),
  getters: {
    getEventsByWeek: (state) => (week, years = []) => {
      const weekStart = parseDate(week.start_date)
      const weekEnd = parseDate(week.end_date)

      return state.events.filter((event) => {
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
    },
    getSubjectItemsByWeekAndYear: (state) => (weekNumber, years = [], subjects = [], calYear = null) => {
      return state.events
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
})

import { defineStore } from 'pinia'
import { extractSpreadsheetId, useSettingsStore } from './settings'

function parseCsv(text) {
  const rows = []
  let currentRow = []
  let currentValue = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const nextCharacter = text[index + 1]

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentValue += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (character === ',' && !inQuotes) {
      currentRow.push(currentValue)
      currentValue = ''
      continue
    }

    if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }
      currentRow.push(currentValue)
      rows.push(currentRow)
      currentRow = []
      currentValue = ''
      continue
    }

    currentValue += character
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue)
    rows.push(currentRow)
  }

  if (!rows.length) {
    return []
  }

  const headers = rows[0].map((header) => header.trim())

  return rows
    .slice(1)
    .filter((row) => row.some((value) => String(value || '').trim() !== ''))
    .map((row) => {
      const entry = {}
      headers.forEach((header, index) => {
        entry[header] = (row[index] || '').trim()
      })
      return entry
    })
}

function parseBooleanFlag(value) {
  return ['1', 'true', 'yes', 'x'].includes(String(value || '').trim().toLowerCase())
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

function sortByWeek(a, b) {
  return Number(a.week_number) - Number(b.week_number)
}

function sortBySubjectThenLabel(a, b) {
  return `${a.subject_abbreviation} ${a.label}`.localeCompare(`${b.subject_abbreviation} ${b.label}`)
}

export const useSpreadsheetStore = defineStore('spreadsheet', {
  state: () => ({
    weeks: [],
    events: [],
    subjects: [],
    tests: [],
    weekDescriptions: [],
    isLoading: false,
    error: '',
    spreadsheetId: '',
  }),
  getters: {
    getTestsByWeekAndYear: (state) => (weekNumber, years = [], subjects = []) => {
      return state.tests
        .filter((item) => Number(item.week_number) === Number(weekNumber))
        .filter((item) => !years.length || years.includes(Number(item.year)))
        .filter((item) => !subjects.length || subjects.includes(item.subject_abbreviation))
        .sort(sortBySubjectThenLabel)
    },
    getEventsByWeek: (state) => (week, years = []) => {
      const startDate = parseDate(week.start_date)
      const endDate = parseDate(week.end_date)

      return state.events.filter((event) => {
        const eventDate = parseDate(event.date)

        if (!eventDate || !startDate || !endDate) {
          return false
        }

        if (eventDate < startDate || eventDate > endDate) {
          return false
        }

        if (!years.length) {
          return true
        }

        return years.some((year) => event[`year_${year}`])
      })
    },
    getWeekDescriptionsBySubjectAndWeek: (state) => (weekNumber, years = [], subjects = []) => {
      return state.weekDescriptions
        .filter((item) => Number(item.week_number) === Number(weekNumber))
        .filter((item) => !years.length || years.includes(Number(item.year)))
        .filter((item) => !subjects.length || subjects.includes(item.subject_abbreviation))
        .sort(sortBySubjectThenLabel)
    },
  },
  actions: {
    buildSheetUrl(sheetName) {
      return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
    },
    async fetchSheetRows(sheetName) {
      const response = await fetch(this.buildSheetUrl(sheetName))

      if (!response.ok) {
        throw new Error(`Kon tab ${sheetName} niet laden (${response.status})`)
      }

      const csvText = await response.text()
      return parseCsv(csvText)
    },
    async fetchWeeks() {
      const rows = await this.fetchSheetRows('weeks')
      this.weeks = rows
        .map((row) => ({
          week_number: Number(row.week_number),
          start_date: row.start_date,
          end_date: row.end_date,
          label: row.label,
        }))
        .sort(sortByWeek)

      return this.weeks
    },
    async fetchEvents() {
      const rows = await this.fetchSheetRows('events')
      this.events = rows.map((row) => ({
        date: row.date,
        description: row.description,
        year_1: parseBooleanFlag(row.year_1),
        year_2: parseBooleanFlag(row.year_2),
        year_3: parseBooleanFlag(row.year_3),
        year_4: parseBooleanFlag(row.year_4),
        year_5: parseBooleanFlag(row.year_5),
        year_6: parseBooleanFlag(row.year_6),
      }))

      return this.events
    },
    async fetchSubjects() {
      const rows = await this.fetchSheetRows('subjects')
      this.subjects = rows
        .map((row) => ({
          abbreviation: row.abbreviation.toUpperCase(),
          full_name: row.full_name,
        }))
        .sort((a, b) => a.abbreviation.localeCompare(b.abbreviation))

      return this.subjects
    },
    async fetchTests() {
      const rows = await this.fetchSheetRows('tests')
      this.tests = rows.map((row) => ({
        week_number: Number(row.week_number),
        type: row.type,
        weight: row.weight,
        subject_abbreviation: row.subject_abbreviation.toUpperCase(),
        year: Number(row.year),
        label: row.label,
        description: row.description,
      }))

      return this.tests
    },
    async fetchWeekDescriptions() {
      const rows = await this.fetchSheetRows('week_descriptions')
      this.weekDescriptions = rows.map((row) => ({
        subject_abbreviation: row.subject_abbreviation.toUpperCase(),
        year: Number(row.year),
        week_number: Number(row.week_number),
        description: row.description,
      }))

      return this.weekDescriptions
    },
    async fetchAllData(spreadsheetInput = '') {
      const settingsStore = useSettingsStore()
      this.error = ''
      this.isLoading = true

      try {
        this.spreadsheetId = extractSpreadsheetId(spreadsheetInput || settingsStore.spreadsheetUrl || this.spreadsheetId)

        if (!this.spreadsheetId) {
          throw new Error('Voer eerst een geldige Google Spreadsheet URL of ID in.')
        }

        await Promise.all([
          this.fetchWeeks(),
          this.fetchEvents(),
          this.fetchSubjects(),
          this.fetchTests(),
          this.fetchWeekDescriptions(),
        ])
      } catch (error) {
        this.error = error.message || 'Onbekende fout tijdens het laden van de spreadsheet.'
        throw error
      } finally {
        this.isLoading = false
      }
    },
  },
})

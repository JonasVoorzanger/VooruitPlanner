#!/usr/bin/env node
// Fetches all tabs from the Google Spreadsheet and writes src/data/spreadsheet.json.
// Run with: npm run load-data
// Requires Node 18+ (native fetch).

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SPREADSHEET_ID = '1FdRh5rWw4Mybxa3FpddUm62BbhS3hSs8QuAQHVu4Pyk'

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

  if (!rows.length) return []

  const headers = rows[0].map((h) => h.trim())

  return rows
    .slice(1)
    .filter((row) => row.some((v) => String(v || '').trim() !== ''))
    .map((row) => {
      const entry = {}
      headers.forEach((header, i) => {
        entry[header] = (row[i] || '').trim()
      })
      return entry
    })
}

// De kolommen in de `subjects` tab die per profiel en leerjaar aangeven of een
// vak in de snelkeuze hoort. Houd dit gelijk aan PROFILE_COLUMNS in
// src/data/profiles.js.
const PROFILE_COLUMNS = ['4_CM', '5_CM', '4_EM', '5_EM', '4_NG', '5_NG', '4_NT', '5_NT']

// De kolommen in de `subjects` tab die aangeven of een vak in dat leerjaar
// verplicht is (4_required, 5_required).
const REQUIRED_YEARS = [4, 5]

function parseBooleanFlag(value) {
  return ['1', 'true', 'yes', 'x'].includes(String(value || '').trim().toLowerCase())
}

async function fetchSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet "${sheetName}": HTTP ${response.status}`)
  }
  return parseCsv(await response.text())
}

async function main() {
  console.log(`Fetching spreadsheet ${SPREADSHEET_ID}...`)

  const [weeksRaw, eventsRaw, subjectsRaw] = await Promise.all([
    fetchSheet('weeks'),
    fetchSheet('events'),
    fetchSheet('subjects'),
  ])

  const weeks = weeksRaw
    .map((row) => ({
      week_number: Number(row.week_number),
      start_date: row.start_date,
      end_date: row.end_date,
      label: row.label,
    }))
    .sort((a, b) => a.week_number - b.week_number)

  const events = eventsRaw.map((row) => ({
    type: row.type,
    cal_year: row.cal_year ? Number(row.cal_year) : null,
    cal_week_number: row.cal_week_number
      ? Number(row.cal_week_number)
      : row.week_number
        ? Number(row.week_number)
        : null,
    date: row.date,
    end_date: row.end_date,
    label: row.label,
    description: row.description,
    subject_abbreviation: row.subject_abbreviation ? row.subject_abbreviation.toUpperCase() : '',
    year: row.year ? Number(row.year) : null,
    weight: row.weight,
    year_1: parseBooleanFlag(row.year_1),
    year_2: parseBooleanFlag(row.year_2),
    year_3: parseBooleanFlag(row.year_3),
    year_4: parseBooleanFlag(row.year_4),
    year_5: parseBooleanFlag(row.year_5),
    year_6: parseBooleanFlag(row.year_6),
  }))

  const subjects = subjectsRaw
    .map((row) => ({
      abbreviation: row.abbreviation.toUpperCase(),
      full_name: row.full_name,
      // Eén vinkje per profiel/leerjaar-kolom (4_CM, 5_CM, 4_EM, ...) bepaalt of
      // het vak in die snelkeuze zit.
      profiles: PROFILE_COLUMNS.reduce((flags, column) => {
        flags[column] = parseBooleanFlag(row[column])
        return flags
      }, {}),
      // Verplicht vak in dat leerjaar? Alleen die vakken zijn het melden waard
      // als er nog geen planner voor is.
      required: REQUIRED_YEARS.reduce((flags, year) => {
        flags[year] = parseBooleanFlag(row[`${year}_required`])
        return flags
      }, {}),
    }))
    .sort((a, b) => a.abbreviation.localeCompare(b.abbreviation))

  const outputPath = join(__dirname, '../src/data/spreadsheet.json')
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, JSON.stringify({ weeks, events, subjects }, null, 2))

  console.log(`Wrote ${outputPath}`)
  console.log(`  ${weeks.length} weeks, ${events.length} events, ${subjects.length} subjects`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})

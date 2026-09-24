// Zet de bestaande PeriodePlanner-data van het HAL als school `hal` in Firestore,
// om mee te testen.
//
//   npm run migrate -- --project vooruitplanner-development
//   npm run migrate -- --emulator            (Firestore-emulator op localhost:8080)
//
// Bronnen: spreadsheet.json (weken, vakken, vakitems) en
// schoolwide-events-2026-2027.csv (schoolbrede items). Opnieuw draaien mag:
// de school houdt hetzelfde id en de documenten worden overschreven.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compact, targetFromArgs, writeSchool } from '../lib/write-school.js'

const SLUG = 'hal'
const SCHOOL_YEAR = '2026-2027'

const here = dirname(fileURLToPath(import.meta.url))
const target = targetFromArgs()

// Minimale CSV-parser: komma's, aanhalingstekens en regeleinden binnen velden.
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"'
        i += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') {
        i += 1
      }
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  const [header, ...body] = rows
  return body
    .filter((cells) => cells.some((cell) => cell.trim()))
    .map((cells) => Object.fromEntries(header.map((key, index) => [key.trim(), (cells[index] ?? '').trim()])))
}

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'x'])

function subjectItem(event) {
  return compact({
    type: event.type,
    label: event.label,
    description: event.description,
    cal_year: event.cal_year === '' ? '' : Number(event.cal_year),
    cal_week_number: event.cal_week_number === '' ? '' : Number(event.cal_week_number),
    year: Number(event.year),
    weight: event.weight === '' ? '' : String(event.weight),
    date: event.date,
    end_date: event.end_date,
  })
}

function schoolWideItem(row) {
  const item = {
    type: 'school-wide',
    label: row.label,
    description: row.description,
    date: row.date,
    end_date: row.end_date,
  }
  for (let year = 1; year <= 6; year += 1) {
    item[`year_${year}`] = TRUE_VALUES.has(String(row[`year_${year}`]).toLowerCase())
  }
  return compact(item)
}

const data = JSON.parse(readFileSync(join(here, 'spreadsheet.json'), 'utf8'))
const schoolWideRows = parseCsv(readFileSync(join(here, 'schoolwide-events-2026-2027.csv'), 'utf8'))

const itemsBySubject = new Map()
data.events
  .filter((event) => String(event.type).trim().toLowerCase() !== 'school-wide')
  .forEach((event) => {
    const abbr = String(event.subject_abbreviation).trim().toUpperCase()
    if (!itemsBySubject.has(abbr)) {
      itemsBySubject.set(abbr, [])
    }
    itemsBySubject.get(abbr).push(subjectItem(event))
  })

const knownSubjects = new Set(data.subjects.map((subject) => subject.abbreviation.toUpperCase()))
const unknown = [...itemsBySubject.keys()].filter((abbr) => !knownSubjects.has(abbr))
if (unknown.length) {
  console.error(`Items voor onbekende vakken: ${unknown.join(', ')}`)
  process.exit(1)
}

await writeSchool(target, {
  slug: SLUG,
  schoolYear: SCHOOL_YEAR,
  school: {
    name: 'HAL',
    color: '#1f5fa7',
    logoUrl: null,
    region: null,
    years: [4, 5],
    profiles: [
      { key: 'CM', label: 'C&M', name: 'Cultuur & Maatschappij' },
      { key: 'EM', label: 'E&M', name: 'Economie & Maatschappij' },
      { key: 'NG', label: 'N&G', name: 'Natuur & Gezondheid' },
      { key: 'NT', label: 'N&T', name: 'Natuur & Techniek' },
    ],
  },
  weeks: data.weeks,
  schoolWide: schoolWideRows.map(schoolWideItem),
  subjects: data.subjects.map((subject) => {
    const abbreviation = subject.abbreviation.toUpperCase()
    return {
      abbreviation,
      fullName: subject.full_name,
      profiles: subject.profiles,
      required: subject.required,
      items: itemsBySubject.get(abbreviation) || [],
    }
  }),
  updatedBy: 'migratie',
})

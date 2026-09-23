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
import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const SLUG = 'hal'
const SCHOOL_YEAR = '2026-2027'
const PROD_PROJECT = 'vooruitplanner'

const here = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const useEmulator = args.includes('--emulator')
const projectIndex = args.indexOf('--project')
const projectId = useEmulator ? 'demo-vooruitplanner' : projectIndex >= 0 ? args[projectIndex + 1] : undefined

if (!projectId) {
  console.error('Geef --project <id> of --emulator mee.')
  process.exit(1)
}
if (projectId === PROD_PROJECT) {
  console.error('Niet naar productie migreren vanuit dit script.')
  process.exit(1)
}
if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080'
}

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

// Alleen gevulde velden opslaan; de store vult de rest weer aan.
function compact(item) {
  return Object.fromEntries(Object.entries(item).filter(([, value]) => value !== '' && value !== null && value !== undefined && value !== false))
}

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

initializeApp({ projectId })
const db = getFirestore()

const slugRef = db.doc(`slugs/${SLUG}`)
const existing = await slugRef.get()
const schoolRef = existing.exists ? db.doc(`schools/${existing.data().schoolId}`) : db.collection('schools').doc()
const yearRef = schoolRef.collection('years').doc(SCHOOL_YEAR)

const batch = db.batch()
batch.set(slugRef, { schoolId: schoolRef.id })
batch.set(
  schoolRef,
  {
    slug: SLUG,
    requestedSlug: SLUG,
    name: 'HAL',
    color: '#1f5fa7',
    logoUrl: null,
    status: 'active',
    region: null,
    years: [4, 5],
    profiles: [
      { key: 'CM', label: 'C&M', name: 'Cultuur & Maatschappij' },
      { key: 'EM', label: 'E&M', name: 'Economie & Maatschappij' },
      { key: 'NG', label: 'N&G', name: 'Natuur & Gezondheid' },
      { key: 'NT', label: 'N&T', name: 'Natuur & Techniek' },
    ],
    currentSchoolYear: SCHOOL_YEAR,
    updatedAt: FieldValue.serverTimestamp(),
    ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  },
  { merge: true },
)
batch.set(yearRef, {
  weeks: data.weeks.map((week) => compact(week)),
  schoolWide: schoolWideRows.map(schoolWideItem),
})
data.subjects.forEach((subject) => {
  const abbr = subject.abbreviation.toUpperCase()
  batch.set(yearRef.collection('subjects').doc(abbr), {
    fullName: subject.full_name,
    profiles: subject.profiles || {},
    required: subject.required || {},
    items: itemsBySubject.get(abbr) || [],
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: 'migratie',
  })
})
await batch.commit()

const itemCount = [...itemsBySubject.values()].reduce((sum, items) => sum + items.length, 0)
console.log(
  `School ${SLUG} (${schoolRef.id}) in ${projectId}: ${data.weeks.length} weken, ` +
    `${schoolWideRows.length} schoolbrede items, ${data.subjects.length} vakken, ${itemCount} vakitems.`,
)

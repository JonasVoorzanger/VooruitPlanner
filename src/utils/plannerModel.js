export const MONTHS = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
]

export const MONTHS_SHORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

export const WEEKDAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

export const WEEKDAYS_LONG = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']

const TYPE_META = {
  plan: { label: 'Planning', test: false },
  proefwerk: { label: 'Proefwerk', test: true },
  so: { label: 'SO', test: true },
  schoolexamen: { label: 'Schoolexamen', test: true },
  presentatie: { label: 'Presentatie', test: true },
  luistertoets: { label: 'Luistertoets', test: true },
  'school-wide': { label: 'Schoolbreed', test: false },
}

export function normalizeType(type) {
  return String(type || '').trim().toLowerCase()
}

export function typeMeta(type) {
  const normalized = normalizeType(type)
  return TYPE_META[normalized] || { label: normalized || 'Item', test: false }
}

export function parseDate(value) {
  if (!value) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`)
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

export function addDays(date, amount) {
  const result = new Date(date.getTime())
  result.setDate(result.getDate() + amount)
  return result
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function formatShort(date) {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`
}

export function weightLabel(weight) {
  const value = String(weight || '').trim()
  if (!value) {
    return ''
  }
  return value.toLowerCase() === 'formatief' ? 'formatief' : `${value}x`
}

export function formatYearShort(date) {
  return String(date.getFullYear()).slice(-2)
}

export function schoolWideEvents(events) {
  return events.filter((event) => normalizeType(event.type) === 'school-wide')
}

const YEAR_KEYS = ['year_1', 'year_2', 'year_3', 'year_4', 'year_5', 'year_6']

function matchesYear(event, year) {
  if (!year) {
    return true
  }

  const hasAnyYearFlag = YEAR_KEYS.some((key) => Boolean(event[key]))
  if (!hasAnyYearFlag) {
    // Empty year flags means the event applies to all years.
    return true
  }

  return Boolean(event[`year_${year}`])
}

export function schoolWideOnDate(events, date, year) {
  return schoolWideEvents(events).filter((event) => {
    const start = parseDate(event.date)
    if (!start) {
      return false
    }
    const end = parseDate(event.end_date) || start
    return date >= start && date <= end && matchesYear(event, year)
  })
}

export function schoolWideInWeek(events, week, year) {
  const weekStart = parseDate(week.start_date)
  const weekEnd = parseDate(week.end_date)
  if (!weekStart || !weekEnd) {
    return []
  }

  return schoolWideEvents(events).filter((event) => {
    const start = parseDate(event.date)
    if (!start) {
      return false
    }
    const end = parseDate(event.end_date) || start
    return !(end < weekStart || start > weekEnd) && matchesYear(event, year)
  })
}

export function subjectEventsInWeek(events, weekNumber, year, courses) {
  return events.filter(
    (event) =>
      normalizeType(event.type) !== 'school-wide' &&
      Number(event.week_number) === Number(weekNumber) &&
      Number(event.year) === Number(year) &&
      courses.includes(event.subject_abbreviation),
  )
}

// Groups a week's subject events per subject, in the order of the chosen
// courses, with tests sorted before planning items inside each group.
export function buildWeekGroups(events, weekNumber, year, courses) {
  return courses
    .map((abbreviation) => {
      const items = events.filter(
        (event) =>
          normalizeType(event.type) !== 'school-wide' &&
          Number(event.week_number) === Number(weekNumber) &&
          Number(event.year) === Number(year) &&
          event.subject_abbreviation === abbreviation,
      )

      if (!items.length) {
        return null
      }

      items.sort((a, b) => (typeMeta(a.type).test ? 0 : 1) - (typeMeta(b.type).test ? 0 : 1))

      return {
        abbr: abbreviation,
        events: items,
        hasTest: items.some((event) => typeMeta(event.type).test),
      }
    })
    .filter(Boolean)
}

export function eventDetail(event, subjectsMap, whenLabel) {
  const meta = typeMeta(event.type)
  return {
    typeLabel: meta.label,
    isTest: meta.test,
    title: event.label || meta.label,
    weightLabel: meta.test ? weightLabel(event.weight) : '',
    description: event.description || '',
    subjectName: (subjectsMap && subjectsMap[event.subject_abbreviation]) || '',
    whenLabel: whenLabel || (event.week_number ? `Week ${event.week_number}` : ''),
  }
}

export function schoolWideWhenLabel(event) {
  const start = parseDate(event.date)
  if (!start) {
    return ''
  }
  const end = parseDate(event.end_date)
  if (end && !sameDay(start, end)) {
    return `${formatShort(start)} – ${formatShort(end)}`
  }
  return `${WEEKDAYS_LONG[(start.getDay() + 6) % 7]} ${formatShort(start)}`
}

const SELECTION_KEY = 'plannerSelection'

export function loadSelection() {
  try {
    const raw = localStorage.getItem(SELECTION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const year = Number(parsed.year)
      const courses = Array.isArray(parsed.courses) ? parsed.courses.filter(Boolean) : []
      if (year >= 1 && year <= 6) {
        return { year, courses }
      }
    }
  } catch {
    // ignore malformed storage
  }
  return { year: 3, courses: [] }
}

export function saveSelection(selection) {
  try {
    localStorage.setItem(SELECTION_KEY, JSON.stringify(selection))
  } catch {
    // storage unavailable
  }
}

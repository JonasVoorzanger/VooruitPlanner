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

export function weekdayShort(date) {
  return WEEKDAYS[(date.getDay() + 6) % 7]
}

// In het weekend is de lopende week praktisch klaar; dan wijst de planner
// vooruit in plaats van naar de week die je net hebt gehad.
export function isWeekendDay(date) {
  return date ? [0, 6].includes(date.getDay()) : false
}

export function weightLabel(weight) {
  const value = String(weight || '').trim()
  if (!value) {
    return ''
  }
  if (value.toLowerCase() === 'formatief' || value.includes('%')) {
    return value.toLowerCase() === 'formatief' ? 'formatief' : value
  }
  return `${value}x`
}

export function formatYearShort(date) {
  return String(date.getFullYear()).slice(-2)
}

// "ma 31 – zo 6 sep '26" — de dagafkortingen maken zichtbaar dat een week van
// maandag tot en met zondag loopt.
export function formatWeekRange(start, end) {
  if (!start || !end) {
    return ''
  }
  return `${weekdayShort(start)} ${start.getDate()} – ${weekdayShort(end)} ${formatShort(end)} '${formatYearShort(end)}`
}

// dd/mm/yy — gebruikt in de bestandsnaam van de pdf-export.
export function formatNumericDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${formatYearShort(date)}`
}

// Vaste bestandsnaam voor de bulkexport, zodat docenten hun eigen bestand
// meteen herkennen: "Planner AK klas 4 24/08/26-16/10/26".
export function subjectExportName(abbreviation, year, start, end) {
  const range = start && end ? ` ${formatNumericDate(start)}-${formatNumericDate(end)}` : ''
  return `Planner ${abbreviation} klas ${year}${range}`
}

export function schoolWideEvents(events) {
  return events.filter((event) => normalizeType(event.type) === 'school-wide')
}

export function isTestEvent(event) {
  return typeMeta(event.type).test
}

// ── Filter op soort item ────────────────────────────────────────────────────
// Elk item valt in precies één categorie, die je los aan en uit kunt zetten:
// toetsen (proefwerk, SE, SO, presentatie, luistertoets), planning (de rest van
// de vakitems) en overig (de schoolbrede activiteiten en vakanties).
export const FILTER_CATEGORIES = [
  { value: 'toetsen', label: 'Toetsen', icon: 'mdi-clipboard-text-clock-outline' },
  { value: 'planning', label: 'Planning', icon: 'mdi-calendar-text-outline' },
  { value: 'overig', label: 'Overig', icon: 'mdi-school-outline' },
]

export const DEFAULT_FILTERS = { toetsen: true, planning: true, overig: true }

export function eventCategory(event) {
  if (normalizeType(event.type) === 'school-wide') {
    return 'overig'
  }
  return isTestEvent(event) ? 'toetsen' : 'planning'
}

export function normalizeFilters(value) {
  const filters = { ...DEFAULT_FILTERS }
  if (value && typeof value === 'object') {
    FILTER_CATEGORIES.forEach(({ value: category }) => {
      if (typeof value[category] === 'boolean') {
        filters[category] = value[category]
      }
    })
  }
  return filters
}

export function filterEventsByCategory(events, filters) {
  const active = normalizeFilters(filters)
  return events.filter((event) => active[eventCategory(event)])
}

// Korte omschrijving van het filter, bijvoorbeeld voor de printkop.
export function filtersLabel(filters) {
  const active = normalizeFilters(filters)
  const on = FILTER_CATEGORIES.filter(({ value }) => active[value])
  if (on.length === FILTER_CATEGORIES.length) {
    return ''
  }
  if (!on.length) {
    return 'niets geselecteerd'
  }
  return `alleen ${on.map(({ label }) => label.toLowerCase()).join(' + ')}`
}

const FILTERS_KEY = 'plannerFilters'

export function loadFilters() {
  try {
    return normalizeFilters(JSON.parse(localStorage.getItem(FILTERS_KEY)))
  } catch {
    return { ...DEFAULT_FILTERS }
  }
}

export function saveFilters(filters) {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(normalizeFilters(filters)))
  } catch {
    // storage unavailable
  }
}

// De vakafkortingen waarvoor voor dit leerjaar items in de spreadsheet staan.
// Vakken die hier niet in zitten hebben nog geen planner.
export function coursesWithItems(events, year) {
  const found = new Set()
  events.forEach((event) => {
    if (normalizeType(event.type) === 'school-wide') {
      return
    }
    if (year && Number(event.year) !== Number(year)) {
      return
    }
    if (event.subject_abbreviation) {
      found.add(event.subject_abbreviation)
    }
  })
  return found
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

// Eén rij per dag (ma t/m zo) voor de dagkolom, die de lijst- en maandweergave
// delen. `monthMonth` is alleen in de maandweergave gezet, om dagen buiten de
// getoonde maand te kunnen dimmen.
export function buildDayRows(events, weekStart, year, today, monthMonth = null) {
  if (!weekStart) {
    return []
  }

  return WEEKDAYS.map((weekday, index) => {
    const date = addDays(weekStart, index)
    return {
      key: date.getTime(),
      weekday,
      num: date.getDate(),
      isWeekend: index >= 5,
      isToday: Boolean(today) && sameDay(date, today),
      inMonth: monthMonth === null ? true : date.getMonth() === monthMonth,
      chips: schoolWideOnDate(events, date, year).map((event) => ({
        event,
        holiday:
          Boolean(event.end_date) &&
          !sameDay(parseDate(event.end_date) || date, parseDate(event.date) || date),
      })),
    }
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

function weekKeyFromWeek(week) {
  const start = parseDate(week && week.start_date)
  return {
    calYear: start ? start.getFullYear() : null,
    calWeekNumber: Number(week && week.week_number),
  }
}

function eventMatchesWeek(event, week) {
  const { calYear, calWeekNumber } = weekKeyFromWeek(week)
  const eventWeekNumber = Number(event.cal_week_number ?? event.week_number)
  if (!Number.isFinite(eventWeekNumber) || eventWeekNumber !== calWeekNumber) {
    return false
  }

  const eventCalYear = Number(event.cal_year)
  if (Number.isFinite(eventCalYear) && Number.isFinite(calYear)) {
    return eventCalYear === calYear
  }

  // Backward compatibility for older datasets without cal_year.
  return true
}

export function subjectEventsInWeek(events, week, year, courses) {
  return events.filter(
    (event) =>
      normalizeType(event.type) !== 'school-wide' &&
      eventMatchesWeek(event, week) &&
      Number(event.year) === Number(year) &&
      courses.includes(event.subject_abbreviation),
  )
}

// Groups a week's subject events per subject, in the order of the chosen
// courses, with tests sorted before planning items inside each group.
export function buildWeekGroups(events, week, year, courses) {
  return courses
    .map((abbreviation) => {
      const items = events.filter(
        (event) =>
          normalizeType(event.type) !== 'school-wide' &&
          eventMatchesWeek(event, week) &&
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
    subjectAbbreviation: event.subject_abbreviation || '',
    subjectName: (subjectsMap && subjectsMap[event.subject_abbreviation]) || '',
    whenLabel: whenLabel || (event.cal_week_number || event.week_number ? `Week ${event.cal_week_number || event.week_number}` : ''),
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
      if (year >= 4 && year <= 5) {
        return { year, courses }
      }
      return { year: null, courses }
    }
  } catch {
    // ignore malformed storage
  }
  return { year: null, courses: [] }
}

export function saveSelection(selection) {
  try {
    localStorage.setItem(SELECTION_KEY, JSON.stringify(selection))
  } catch {
    // storage unavailable
  }
}

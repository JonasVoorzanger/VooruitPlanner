// Een verzonnen school om VooruitPlanner mee te laten zien en te testen: het
// Demo College, op /demo. Alles is gegenereerd; er zit geen echte planning of
// persoonsgegeven in. Het rooster lijkt op een gewoon schooljaar, maar de
// vakanties zijn geen officiële data.
//
// buildDemoSchool() geeft alles wat writeSchool() nodig heeft.

export const DEMO_SLUG = 'demo'
export const DEMO_SCHOOL_YEAR = '2026-2027'

const FIRST_MONDAY = '2026-08-24'
const LAST_MONDAY = '2027-07-05'

// Weken zonder lessen, op maandag.
const VACATIONS = {
  '2026-10-19': 'Herfstvakantie',
  '2026-12-21': 'Kerstvakantie',
  '2026-12-28': 'Kerstvakantie',
  '2027-02-15': 'Voorjaarsvakantie',
  '2027-04-26': 'Meivakantie',
  '2027-05-03': 'Meivakantie',
}

// De vier toetsweken; elke toetsweek sluit een periode af.
const TEST_WEEKS = ['2026-11-09', '2027-01-25', '2027-04-12', '2027-06-21']

const PROFILES = [
  { key: 'CM', label: 'C&M', name: 'Cultuur & Maatschappij' },
  { key: 'EM', label: 'E&M', name: 'Economie & Maatschappij' },
  { key: 'NG', label: 'N&G', name: 'Natuur & Gezondheid' },
  { key: 'NT', label: 'N&T', name: 'Natuur & Techniek' },
]

// kind: hoe de planning eruitziet (zie planLabel).
// years: in welke leerjaren het vak gegeven wordt.
// profiles: bij welke profielen het vak hoort; 'all' voor het gemeenschappelijk deel.
// required: of het vak in die profielen verplicht is en dus in de snelkeuze zit
// (anders is het een keuzevak).
const SUBJECTS = [
  { abbreviation: 'NL', fullName: 'Nederlands', kind: 'language', profiles: 'all', required: true },
  { abbreviation: 'EN', fullName: 'Engels', kind: 'language', profiles: 'all', required: true },
  { abbreviation: 'FR', fullName: 'Frans', kind: 'language', profiles: ['CM'], required: true },
  { abbreviation: 'DU', fullName: 'Duits', kind: 'language', profiles: ['CM'], required: false },
  { abbreviation: 'WA', fullName: 'Wiskunde A', kind: 'book', profiles: ['EM', 'NG'], required: true },
  { abbreviation: 'WB', fullName: 'Wiskunde B', kind: 'book', profiles: ['NT'], required: true },
  { abbreviation: 'WC', fullName: 'Wiskunde C', kind: 'book', profiles: ['CM'], required: true },
  { abbreviation: 'NA', fullName: 'Natuurkunde', kind: 'book', profiles: ['NT'], required: true },
  { abbreviation: 'SK', fullName: 'Scheikunde', kind: 'book', profiles: ['NG', 'NT'], required: true },
  { abbreviation: 'BIO', fullName: 'Biologie', kind: 'book', profiles: ['NG'], required: true },
  { abbreviation: 'AK', fullName: 'Aardrijkskunde', kind: 'book', profiles: ['CM', 'EM'], required: true },
  { abbreviation: 'GS', fullName: 'Geschiedenis', kind: 'book', profiles: ['CM', 'EM'], required: true },
  { abbreviation: 'ECO', fullName: 'Economie', kind: 'book', profiles: ['EM'], required: true },
  { abbreviation: 'BECO', fullName: 'Bedrijfseconomie', kind: 'book', profiles: ['EM'], required: false },
  { abbreviation: 'IN', fullName: 'Informatica', kind: 'project', profiles: ['NT'], required: false },
  { abbreviation: 'FI', fullName: 'Filosofie', kind: 'book', profiles: ['CM'], required: false },
  { abbreviation: 'MAW', fullName: 'Maatschappijwetenschappen', kind: 'book', profiles: ['CM', 'EM'], required: false },
  { abbreviation: 'MA', fullName: 'Maatschappijleer', kind: 'book', profiles: 'all', required: true, years: [4] },
  { abbreviation: 'CKV', fullName: 'CKV', kind: 'project', profiles: 'all', required: true, years: [4] },
  { abbreviation: 'LO', fullName: 'Lichamelijke opvoeding', kind: 'sport', profiles: 'all', required: true },
]

const LANGUAGE_SKILLS = ['leesvaardigheid', 'grammatica', 'schrijfvaardigheid', 'woordenschat', 'kijk- en luistervaardigheid']
const SPORT_BLOCKS = ['Atletiek', 'Volleybal', 'Turnen', 'Basketbal', 'Zelfverdediging', 'Hockey', 'Dans', 'Softbal']
const PROJECT_STEPS = ['Oriëntatie', 'Onderzoeksvraag', 'Uitwerken', 'Feedbackronde', 'Afronden']

function isoDate(date) {
  return date.toISOString().slice(0, 10)
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return isoDate(date)
}

// ISO-weeknummer: de week van de donderdag telt.
function isoWeek(dateString) {
  const thursday = new Date(`${dateString}T12:00:00Z`)
  thursday.setUTCDate(thursday.getUTCDate() + 3 - ((thursday.getUTCDay() + 6) % 7))
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1)
  return Math.floor((thursday - yearStart) / (24 * 3600 * 1000) / 7) + 1
}

function buildWeeks() {
  const weeks = []
  let lesweek = 0
  for (let monday = FIRST_MONDAY; monday <= LAST_MONDAY; monday = addDays(monday, 7)) {
    let label
    let kind
    if (VACATIONS[monday]) {
      label = VACATIONS[monday]
      kind = 'vacation'
    } else if (TEST_WEEKS.includes(monday)) {
      label = `Toetsweek ${TEST_WEEKS.indexOf(monday) + 1}`
      kind = 'test'
    } else if (monday >= addDays(LAST_MONDAY, -7)) {
      label = monday === LAST_MONDAY ? 'Slotweek 2' : 'Slotweek 1'
      kind = 'closing'
    } else {
      lesweek += 1
      label = `Lesweek ${lesweek}`
      kind = 'lesson'
    }
    weeks.push({
      week_number: isoWeek(monday),
      start_date: monday,
      end_date: addDays(monday, 6),
      label,
      kind,
      period: TEST_WEEKS.filter((testWeek) => testWeek < monday).length + 1,
    })
  }
  return weeks
}

function weekItem(week, fields) {
  return {
    cal_year: Number(week.start_date.slice(0, 4)),
    cal_week_number: week.week_number,
    ...fields,
  }
}

// Een weektaak voor dit vak; n telt de lesweken binnen het hoofdstuk, lesson
// de lesweken van het hele jaar.
function planLabel(subject, n, chapter, year, lesson) {
  switch (subject.kind) {
    case 'language':
      return `Thema ${chapter}: ${LANGUAGE_SKILLS[n % LANGUAGE_SKILLS.length]}`
    case 'sport':
      return SPORT_BLOCKS[(Math.floor(lesson / 4) + year) % SPORT_BLOCKS.length]
    case 'project':
      return `Project ${chapter}: ${PROJECT_STEPS[n % PROJECT_STEPS.length].toLowerCase()}`
    default:
      return `H${chapter} §${chapter}.${n + 1}`
  }
}

// Elke periode heeft twee hoofdstukken; in klas 5 gaat de nummering door waar
// klas 4 ophield.
function chaptersOf(period, year) {
  const first = (year - 4) * 8 + period * 2 - 1
  return [first, first + 1]
}

function subjectItems(subject, subjectIndex, year, weeks) {
  const items = []
  const isExamYear = year === 5
  const periods = [1, 2, 3, 4]
  const allLessonWeeks = weeks.filter((week) => week.kind === 'lesson')

  periods.forEach((period) => {
    const [first, second] = chaptersOf(period, year)
    const lessonWeeks = weeks.filter((week) => week.kind === 'lesson' && week.period === period)
    const half = Math.ceil(lessonWeeks.length / 2)

    lessonWeeks.forEach((week, index) => {
      const chapter = index < half ? first : second
      const step = index < half ? index : index - half
      const lesson = allLessonWeeks.indexOf(week)
      const item = { type: 'plan', year, label: planLabel(subject, step, chapter, year, lesson) }
      if (subject.kind === 'book' && index === half - 1) {
        item.description = `Afronding H${chapter}: maak de diagnostische toets en de extra opgaven.`
      }
      items.push(weekItem(week, item))
    })

    if (subject.kind === 'sport') {
      return
    }

    // Halverwege de periode een SO, niet bij elk vak in dezelfde week.
    if (subject.kind !== 'project' && lessonWeeks.length > 3) {
      const soWeek = lessonWeeks[Math.min(lessonWeeks.length - 2, half - 1 + (subjectIndex % 2))]
      const label = subject.kind === 'language' ? `SO woordenschat thema ${first}` : `SO H${first}`
      items.push(weekItem(soWeek, { type: 'so', year, label, weight: isExamYear ? '5%' : '1' }))
    }

    // In de toetsweek de afsluitende toets van de periode.
    const testWeek = weeks.find((week) => week.kind === 'test' && week.period === period)
    if (!testWeek || subject.kind === 'project') {
      return
    }
    const stof = subject.kind === 'language' ? `thema ${first} en ${second}` : `H${first} en H${second}`
    items.push(
      weekItem(testWeek, {
        type: isExamYear ? 'schoolexamen' : 'proefwerk',
        year,
        label: isExamYear ? `SE ${period}: ${stof}` : `Proefwerk ${stof}`,
        description:
          subject.kind === 'language'
            ? `Stof: ${stof}. Een woordenboek is niet toegestaan.`
            : `Stof: ${stof}. Neem je rekenmachine mee.`,
        weight: isExamYear ? '15%' : '3',
      }),
    )
  })

  // Eén praktische opdracht of presentatie per jaar, in de derde periode.
  const lateWeeks = weeks.filter((week) => week.kind === 'lesson' && week.period === 3)
  const deadline = lateWeeks[lateWeeks.length - 1]
  if (deadline && subject.kind === 'project') {
    items.push(
      weekItem(deadline, {
        type: 'praktische opdracht',
        year,
        label: `Inleveren eindproduct ${subject.fullName}`,
        description: 'Lever je eindproduct en je logboek in via de ELO.',
        weight: isExamYear ? '20%' : '4',
      }),
    )
  } else if (deadline && subject.kind === 'language' && subjectIndex % 2 === 1) {
    items.push(weekItem(deadline, { type: 'presentatie', year, label: 'Presentatie actueel onderwerp', weight: isExamYear ? '10%' : '2' }))
  } else if (deadline && subject.kind === 'language') {
    items.push(weekItem(deadline, { type: 'luistertoets', year, label: 'Kijk- en luistertoets', weight: isExamYear ? '10%' : '2' }))
  } else if (deadline && subjectIndex % 3 === 0) {
    items.push(
      weekItem(deadline, {
        type: 'praktische opdracht',
        year,
        label: 'Praktische opdracht: onderzoeksverslag',
        description: 'Werk in tweetallen. De opdracht staat in de ELO.',
        weight: isExamYear ? '10%' : '2',
      }),
    )
  }

  return items
}

function flags(years) {
  return Object.fromEntries([1, 2, 3, 4, 5, 6].map((year) => [`year_${year}`, years.includes(year)]))
}

const ALL_YEARS = [1, 2, 3, 4, 5, 6]
const UPPER_YEARS = [4, 5]

function buildSchoolWide(weeks) {
  const items = [
    { label: 'Eerste lesdag', date: '2026-08-24', years: ALL_YEARS, description: 'De lessen beginnen om 8:30 volgens het rooster.' },
    { label: 'Informatieavond klas 4', date: '2026-09-10', years: [4], description: 'Voor ouders en leerlingen, aanvang 19:30 in de aula.' },
    { label: 'Informatieavond klas 5', date: '2026-09-17', years: [5], description: 'Over het examenjaar en het PTA, aanvang 19:30.' },
    { label: 'Studiedag', date: '2026-10-07', years: ALL_YEARS, description: 'Geen lessen: de docenten hebben een studiedag.' },
    { label: 'Excursie klas 4', date: '2026-10-01', years: [4] },
    { label: 'Kerstviering', date: '2026-12-18', years: ALL_YEARS, description: 'Lessen tot 12:00, daarna de kerstviering.' },
    { label: 'Ouderavond', date: '2027-02-04', years: ALL_YEARS, description: 'Tienminutengesprekken met mentoren en docenten.' },
    { label: 'Studiedag', date: '2027-03-17', years: ALL_YEARS, description: 'Geen lessen.' },
    { label: 'Deadline profielwerkstuk', date: '2027-03-05', years: [5], description: 'Lever het profielwerkstuk in bij je begeleider.' },
    { label: 'Koningsdag', date: '2027-04-27', years: ALL_YEARS },
    { label: 'Sportdag', date: '2027-06-30', years: ALL_YEARS },
    { label: 'Laatste schooldag', date: '2027-07-09', years: ALL_YEARS },
  ]

  weeks
    .filter((week) => week.kind === 'test')
    .forEach((week) => {
      items.push({ label: week.label, date: week.start_date, end_date: addDays(week.start_date, 4), years: UPPER_YEARS })
      items.push({
        label: 'Rapport',
        date: addDays(week.start_date, 11),
        years: UPPER_YEARS,
        description: 'De cijfers van deze periode staan in het leerlingvolgsysteem.',
      })
    })

  // Een vakantie is één item van zaterdag tot en met zondag.
  const vacationWeeks = weeks.filter((week) => week.kind === 'vacation')
  vacationWeeks.forEach((week, index) => {
    const previous = vacationWeeks[index - 1]
    if (previous && previous.label === week.label) {
      return
    }
    const last = vacationWeeks.slice(index).findLast((other) => other.label === week.label)
    items.push({ label: week.label, date: addDays(week.start_date, -2), end_date: last.end_date, years: ALL_YEARS })
  })
  items.push({ label: 'Zomervakantie', date: '2027-07-10', end_date: '2027-08-22', years: ALL_YEARS })

  return items
    .map(({ years, ...item }) => ({ type: 'school-wide', ...item, ...flags(years) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function profileFlags(subject) {
  const years = subject.years || UPPER_YEARS
  return Object.fromEntries(
    UPPER_YEARS.flatMap((year) =>
      PROFILES.map(({ key }) => [
        `${year}_${key}`,
        years.includes(year) && subject.required && (subject.profiles === 'all' || subject.profiles.includes(key)),
      ]),
    ),
  )
}

export function buildDemoSchool() {
  const weeks = buildWeeks()
  const subjects = SUBJECTS.map((subject, index) => {
    const years = subject.years || UPPER_YEARS
    return {
      abbreviation: subject.abbreviation,
      fullName: subject.fullName,
      profiles: profileFlags(subject),
      required: Object.fromEntries(UPPER_YEARS.map((year) => [String(year), years.includes(year) && subject.required])),
      items: years.flatMap((year) => subjectItems(subject, index, year, weeks)),
    }
  })

  return {
    slug: DEMO_SLUG,
    schoolYear: DEMO_SCHOOL_YEAR,
    school: {
      name: 'Demo College',
      color: '#0f766e',
      logoUrl: null,
      region: 'midden',
      years: UPPER_YEARS,
      profiles: PROFILES,
    },
    weeks: weeks.map(({ week_number, start_date, end_date, label }) => ({ week_number, start_date, end_date, label })),
    schoolWide: buildSchoolWide(weeks),
    subjects,
    updatedBy: 'demo',
  }
}

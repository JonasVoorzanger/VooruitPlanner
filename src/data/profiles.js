// Profielen voor de snelkeuze op het onboardingscherm.
//
// ── Hier pas je de vakken aan ────────────────────────────────────────────────
// Vul per profiel en per leerjaar de afkortingen in die in de `subjects` tab van
// de spreadsheet staan (zie src/data/spreadsheet.json). Afkortingen die niet in
// de spreadsheet voorkomen worden stil overgeslagen, dus een profiel kapot maken
// kan niet — er verschijnen dan simpelweg minder vakken.
//
// De lijsten hieronder zijn voorlopige standaardwaarden; vervang ze door de
// echte vakkenpakketten van de school.

export const COMMON_COURSES = {
  4: ['NL', 'EN', 'LO', 'CKV', 'ML'],
  5: ['NL', 'EN', 'LO', 'CPB'],
}

export const PROFILES = [
  {
    id: 'cm',
    label: 'C&M',
    name: 'Cultuur & Maatschappij',
    courses: {
      4: ['GS', 'AK', 'KG', 'FI', 'FR'],
      5: ['GS', 'AK', 'KG', 'FI', 'FR', 'MAW'],
    },
  },
  {
    id: 'em',
    label: 'E&M',
    name: 'Economie & Maatschappij',
    courses: {
      4: ['ECO', 'GS', 'AK', 'WA'],
      5: ['ECO', 'GS', 'AK', 'WA', 'BECO'],
    },
  },
  {
    id: 'ng',
    label: 'N&G',
    name: 'Natuur & Gezondheid',
    courses: {
      4: ['BIO', 'SK', 'NA', 'WA'],
      5: ['BIO', 'SK', 'NA', 'WA', 'AK'],
    },
  },
  {
    id: 'nt',
    label: 'N&T',
    name: 'Natuur & Techniek',
    courses: {
      4: ['NA', 'SK', 'WB', 'BIO'],
      5: ['NA', 'SK', 'WB', 'WD', 'NLT'],
    },
  },
]

// Combineert de gemeenschappelijke vakken met de profielvakken voor één
// leerjaar, zonder dubbelingen en met behoud van de volgorde hierboven.
export function profileCourses(profile, year) {
  if (!profile) {
    return []
  }

  const common = COMMON_COURSES[year] || []
  const specific = (profile.courses && profile.courses[year]) || []
  return [...new Set([...common, ...specific])]
}

// Alleen de vakken die ook echt in de spreadsheet staan.
export function availableProfileCourses(profile, year, subjects) {
  const known = new Set(subjects.map((subject) => subject.abbreviation))
  return profileCourses(profile, year).filter((abbreviation) => known.has(abbreviation))
}

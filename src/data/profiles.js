// Profielen voor de snelkeuze op het onboardingscherm.
//
// Elk vak heeft per profiel en leerjaar een vinkje: 4_CM, 5_CM, 4_EM, 5_EM,
// 4_NG, 5_NG, 4_NT en 5_NT. Staat het vinkje aan, dan hoort het vak bij die
// snelkeuze.

// De sleutels van die vinkjes.
export const PROFILE_COLUMNS = ['4_CM', '5_CM', '4_EM', '5_EM', '4_NG', '5_NG', '4_NT', '5_NT']

export const PROFILES = [
  { id: 'cm', key: 'CM', label: 'C&M', name: 'Cultuur & Maatschappij' },
  { id: 'em', key: 'EM', label: 'E&M', name: 'Economie & Maatschappij' },
  { id: 'ng', key: 'NG', label: 'N&G', name: 'Natuur & Gezondheid' },
  { id: 'nt', key: 'NT', label: 'N&T', name: 'Natuur & Techniek' },
]

// De kolom in de `subjects` tab die bij dit profiel en leerjaar hoort.
export function profileColumn(profile, year) {
  if (!profile || !profile.key || !year) {
    return ''
  }
  return `${year}_${profile.key}`
}

// De vakken die zijn aangevinkt voor dit profiel en leerjaar.
export function availableProfileCourses(profile, year, subjects = []) {
  const column = profileColumn(profile, year)
  if (!column) {
    return []
  }

  return subjects
    .filter((subject) => Boolean(subject.profiles && subject.profiles[column]))
    .map((subject) => subject.abbreviation)
}

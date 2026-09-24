import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'

const LAST_SCHOOL_KEY = 'plannerLastSchool'

// Alle actieve scholen, voor het zoekscherm op de voorpagina. Dat zijn er hooguit
// een paar honderd, dus we zoeken in de browser.
export async function loadActiveSchools() {
  const snapshot = await getDocs(query(collection(db, 'schools'), where('status', '==', 'active')))
  return snapshot.docs
    .map((schoolSnap) => ({ ...schoolSnap.data(), id: schoolSnap.id }))
    .filter((school) => school.slug && school.name)
    .sort((a, b) => a.name.localeCompare(b.name, 'nl'))
}

// Kleine letters en zonder accenten, zodat "lyceum" ook "Lycéum" vindt.
function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Elk woord uit de zoekopdracht moet in de naam of de slug staan.
export function matchSchools(schools, search) {
  const words = normalize(search).split(/[\s-]+/).filter(Boolean)
  if (!words.length) {
    return []
  }
  return schools.filter((school) => {
    const haystack = `${normalize(school.name)} ${school.slug}`
    return words.every((word) => haystack.includes(word))
  })
}

// De laatst bezochte school, zodat een leerling op de voorpagina met één klik
// terug is.
export function lastSchool() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LAST_SCHOOL_KEY))
    return parsed && parsed.address && parsed.name ? parsed : null
  } catch {
    return null
  }
}

export function rememberSchool(address, name) {
  try {
    localStorage.setItem(LAST_SCHOOL_KEY, JSON.stringify({ address, name }))
  } catch {
    // opslag niet beschikbaar
  }
}

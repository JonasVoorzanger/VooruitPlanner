// Tests voor firestore.rules. Draai met `npm run test:rules`; dat start de
// Firestore-emulator onder een demo-project, zodat er niets echts geraakt wordt.
import { readFileSync } from 'node:fs'
import { after, before, beforeEach, describe, test } from 'node:test'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore'

const YEAR = '2026-2027'
let env

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-vooruitplanner',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

after(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'slugs/hal'), { schoolId: 'school-a' })
    await setDoc(doc(db, 'schools/school-a'), { slug: 'hal', name: 'HAL', status: 'active' })
    await setDoc(doc(db, 'schools/school-a/members/owner-a'), { role: 'owner', email: 'o@a.nl' })
    await setDoc(doc(db, 'schools/school-a/members/admin-a'), { role: 'admin', email: 'a@a.nl' })
    await setDoc(doc(db, `schools/school-a/years/${YEAR}`), { weeks: [], schoolWide: [] })
    await setDoc(doc(db, `schools/school-a/years/${YEAR}/subjects/NL`), { fullName: 'Nederlands', items: [] })

    await setDoc(doc(db, 'schools/school-p'), { requestedSlug: 'nieuw', name: 'Nieuw', status: 'pending' })
    await setDoc(doc(db, 'schools/school-p/members/owner-p'), { role: 'owner', email: 'o@p.nl' })
    await setDoc(doc(db, `schools/school-p/years/${YEAR}/subjects/NL`), { fullName: 'Nederlands', items: [] })

    await setDoc(doc(db, 'private/school-a'), { editorPasswordHash: 'x' })
    await setDoc(doc(db, 'feedback/f1'), { message: 'hoi', context: {}, schoolId: 'school-a' })
  })
})

const anon = () => env.unauthenticatedContext().firestore()
const user = (uid, claims = {}) => env.authenticatedContext(uid, claims).firestore()
const editorOf = (school) => user('editor-' + school, { school, role: 'editor' })
const superAdmin = () => user('jonas', { superAdmin: true })

describe('leerlingen (niet ingelogd)', () => {
  test('lezen een actieve school met jaar en vakken', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'slugs/hal')))
    await assertSucceeds(getDoc(doc(anon(), 'schools/school-a')))
    await assertSucceeds(getDoc(doc(anon(), `schools/school-a/years/${YEAR}`)))
    await assertSucceeds(getDoc(doc(anon(), `schools/school-a/years/${YEAR}/subjects/NL`)))
  })

  test('lezen geen school die nog niet is goedgekeurd', async () => {
    await assertFails(getDoc(doc(anon(), 'schools/school-p')))
    await assertFails(getDoc(doc(anon(), `schools/school-p/years/${YEAR}/subjects/NL`)))
  })

  test('lezen geen beheerders, privégegevens of feedback', async () => {
    await assertFails(getDoc(doc(anon(), 'schools/school-a/members/owner-a')))
    await assertFails(getDoc(doc(anon(), 'private/school-a')))
    await assertFails(getDoc(doc(anon(), 'feedback/f1')))
  })

  test('schrijven niets in de planning', async () => {
    await assertFails(updateDoc(doc(anon(), `schools/school-a/years/${YEAR}/subjects/NL`), { items: [] }))
    await assertFails(setDoc(doc(anon(), 'slugs/nep'), { schoolId: 'school-a' }))
  })
})

describe('feedback', () => {
  const valid = () => ({ message: 'Top!', context: { view: 'list' }, schoolId: 'school-a', createdAt: serverTimestamp() })

  test('iedereen kan geldige feedback achterlaten', async () => {
    await assertSucceeds(addDoc(collection(anon(), 'feedback'), valid()))
  })

  test('te lang, leeg of met extra velden wordt geweigerd', async () => {
    await assertFails(addDoc(collection(anon(), 'feedback'), { ...valid(), message: 'x'.repeat(1001) }))
    await assertFails(addDoc(collection(anon(), 'feedback'), { ...valid(), message: '' }))
    await assertFails(addDoc(collection(anon(), 'feedback'), { ...valid(), email: 'a@b.nl' }))
  })

  test('beheerders lezen alleen feedback van hun eigen school', async () => {
    await assertSucceeds(getDoc(doc(user('admin-a'), 'feedback/f1')))
    await assertFails(getDoc(doc(user('owner-p'), 'feedback/f1')))
    await assertSucceeds(getDoc(doc(superAdmin(), 'feedback/f1')))
  })
})

describe('editors (docenten)', () => {
  const subject = (db, school = 'school-a') => doc(db, `schools/${school}/years/${YEAR}/subjects/NL`)

  test('mogen de items van een vak van hun eigen school aanpassen', async () => {
    await assertSucceeds(
      updateDoc(subject(editorOf('school-a')), {
        items: [{ type: 'plan', label: 'H1' }],
        updatedAt: serverTimestamp(),
        updatedBy: 'Mevr. de Vries',
      }),
    )
  })

  test('mogen geen andere velden of andere scholen aanpassen', async () => {
    await assertFails(updateDoc(subject(editorOf('school-a')), { fullName: 'Iets anders', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(subject(editorOf('school-b'), 'school-a'), { items: [], updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(subject(editorOf('school-a'), 'school-p'), { items: [], updatedAt: serverTimestamp() }))
  })

  test('moeten de servertijd meesturen', async () => {
    await assertFails(updateDoc(subject(editorOf('school-a')), { items: [] }))
  })

  test('mogen geen vakken aanmaken of verwijderen', async () => {
    await assertFails(setDoc(doc(editorOf('school-a'), `schools/school-a/years/${YEAR}/subjects/XX`), { items: [] }))
    await assertFails(deleteDoc(subject(editorOf('school-a'))))
  })
})

describe('beheerders', () => {
  test('beheren hun eigen school, maar niet de status of het adres', async () => {
    await assertSucceeds(updateDoc(doc(user('admin-a'), 'schools/school-a'), { name: 'Het Lyceum' }))
    await assertFails(updateDoc(doc(user('admin-a'), 'schools/school-a'), { status: 'pending' }))
    await assertFails(updateDoc(doc(user('owner-p'), 'schools/school-p'), { status: 'active' }))
    await assertFails(updateDoc(doc(user('owner-p'), 'schools/school-p'), { slug: 'hal' }))
  })

  test('zien hun eigen school ook als die nog niet is goedgekeurd', async () => {
    await assertSucceeds(getDoc(doc(user('owner-p'), 'schools/school-p')))
    await assertSucceeds(getDoc(doc(user('owner-p'), `schools/school-p/years/${YEAR}/subjects/NL`)))
  })

  test('kunnen niet bij andere scholen', async () => {
    await assertFails(getDoc(doc(user('admin-a'), 'schools/school-p')))
    await assertFails(setDoc(doc(user('owner-p'), `schools/school-a/years/${YEAR}/subjects/XX`), { items: [] }))
  })

  test('alleen de eigenaar beheert de beheerders, en niet zichzelf', async () => {
    await assertSucceeds(setDoc(doc(user('owner-a'), 'schools/school-a/members/new'), { role: 'admin', email: 'n@a.nl' }))
    await assertFails(setDoc(doc(user('admin-a'), 'schools/school-a/members/new'), { role: 'admin', email: 'n@a.nl' }))
    await assertFails(updateDoc(doc(user('owner-a'), 'schools/school-a/members/owner-a'), { role: 'admin' }))
  })

  test('kunnen geen scholen aanmaken of adressen toekennen', async () => {
    await assertFails(setDoc(doc(user('admin-a'), 'schools/nieuw'), { status: 'active' }))
    await assertFails(setDoc(doc(user('admin-a'), 'slugs/mijn'), { schoolId: 'school-a' }))
  })

  test('lezen nooit de privégegevens', async () => {
    await assertFails(getDoc(doc(user('owner-a'), 'private/school-a')))
  })
})

describe('super-admin', () => {
  test('ziet en beheert alle scholen', async () => {
    await assertSucceeds(getDoc(doc(superAdmin(), 'schools/school-p')))
    await assertSucceeds(updateDoc(doc(superAdmin(), 'schools/school-p'), { status: 'active', slug: 'nieuw' }))
    await assertSucceeds(setDoc(doc(superAdmin(), 'slugs/nieuw'), { schoolId: 'school-p' }))
    await assertSucceeds(setDoc(doc(superAdmin(), `schools/school-p/years/${YEAR}/subjects/WI`), { items: [] }))
  })
})

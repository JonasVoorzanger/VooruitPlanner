// Gedeeld door de scripts die een school in Firestore zetten (migratie van het
// HAL, de demoschool): kiezen waarheen, en de school wegschrijven.
//
//   --project <id>   een echt Firebase-project (nooit productie)
//   --emulator       de Firestore-emulator op localhost:8080
//
// Inloggen bij een echt project gaat met de application-default credentials van
// gcloud, of met een service-account-sleutel (JSON) in de omgevingsvariabele
// FIREBASE_SERVICE_ACCOUNT.
import { cert, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const PROD_PROJECT = 'vooruitplanner'
const EMULATOR_PROJECT = 'demo-vooruitplanner'

// Alleen gevulde velden opslaan; de store vult de rest weer aan.
export function compact(item) {
  return Object.fromEntries(
    Object.entries(item).filter(([, value]) => value !== '' && value !== null && value !== undefined && value !== false),
  )
}

// Het project uit de opdrachtregel. Stopt bij productie of als er niets is
// opgegeven.
export function targetFromArgs(args = process.argv.slice(2)) {
  const useEmulator = args.includes('--emulator')
  const projectIndex = args.indexOf('--project')
  const projectId = useEmulator ? EMULATOR_PROJECT : projectIndex >= 0 ? args[projectIndex + 1] : undefined

  if (!projectId) {
    console.error('Geef --project <id> of --emulator mee.')
    process.exit(1)
  }
  if (projectId === PROD_PROJECT) {
    console.error('Niet naar productie schrijven vanuit dit script.')
    process.exit(1)
  }
  if (useEmulator) {
    process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080'
  }
  return { projectId, useEmulator }
}

function connect({ projectId, useEmulator }) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  const options = { projectId }
  if (serviceAccount && !useEmulator) {
    const key = JSON.parse(serviceAccount)
    if (key.project_id && key.project_id !== projectId) {
      console.error(`De sleutel in FIREBASE_SERVICE_ACCOUNT hoort bij ${key.project_id}, niet bij ${projectId}.`)
      process.exit(1)
    }
    options.credential = cert(key)
  }
  initializeApp(options)
  return getFirestore()
}

// Zet een actieve school met één schooljaar neer. Opnieuw draaien mag: de
// school houdt hetzelfde id en de documenten worden overschreven.
//
//   school:   de velden van schools/{id}, zonder slug en status
//   subjects: [{ abbreviation, fullName, profiles, required, items }]
export async function writeSchool(target, { slug, schoolYear, school, weeks, schoolWide, subjects, updatedBy }) {
  const db = connect(target)

  const slugRef = db.doc(`slugs/${slug}`)
  const existing = await slugRef.get()
  const schoolRef = existing.exists ? db.doc(`schools/${existing.data().schoolId}`) : db.collection('schools').doc()
  const yearRef = schoolRef.collection('years').doc(schoolYear)

  // Vakken die er niet meer in zitten, verdwijnen ook uit Firestore.
  const oldSubjects = await yearRef.collection('subjects').listDocuments()
  const keep = new Set(subjects.map((subject) => subject.abbreviation))

  const batch = db.batch()
  batch.set(slugRef, { schoolId: schoolRef.id })
  batch.set(
    schoolRef,
    {
      ...school,
      slug,
      requestedSlug: slug,
      status: 'active',
      currentSchoolYear: schoolYear,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  )
  batch.set(yearRef, { weeks: weeks.map(compact), schoolWide: schoolWide.map(compact) })
  oldSubjects.filter((ref) => !keep.has(ref.id)).forEach((ref) => batch.delete(ref))
  subjects.forEach((subject) => {
    batch.set(yearRef.collection('subjects').doc(subject.abbreviation), {
      fullName: subject.fullName,
      profiles: subject.profiles || {},
      required: subject.required || {},
      items: (subject.items || []).map(compact),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy,
    })
  })
  await batch.commit()

  const itemCount = subjects.reduce((sum, subject) => sum + (subject.items || []).length, 0)
  console.log(
    `School ${slug} (${schoolRef.id}) in ${target.projectId}: ${weeks.length} weken, ` +
      `${schoolWide.length} schoolbrede items, ${subjects.length} vakken, ${itemCount} vakitems.`,
  )
}

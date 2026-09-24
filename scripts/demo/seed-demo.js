// Zet het Demo College (verzonnen, zie demo-school.js) als school `demo` in
// Firestore.
//
//   npm run seed:demo -- --project vooruitplanner-development
//   npm run seed:demo -- --emulator            (Firestore-emulator op localhost:8080)
//
// Opnieuw draaien mag: de school houdt hetzelfde id en de documenten worden
// overschreven.
import { targetFromArgs, writeSchool } from '../lib/write-school.js'
import { buildDemoSchool } from './demo-school.js'

await writeSchool(targetFromArgs(), buildDemoSchool())

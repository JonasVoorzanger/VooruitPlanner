import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

// De config komt uit .env.development.local of .env.production.local; zie
// .env.example.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// VITE_USE_EMULATOR=true: praat met de lokale emulators (`firebase emulators:start`)
// onder een demo-project in plaats van met een echt project.
const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true'
if (useEmulator) {
  firebaseConfig.projectId = 'demo-vooruitplanner'
  firebaseConfig.apiKey ||= 'demo'
}

if (!firebaseConfig.projectId) {
  throw new Error('VITE_FIREBASE_PROJECT_ID ontbreekt; zie .env.example.')
}

export const firebaseApp = initializeApp(firebaseConfig)
export const db = getFirestore(firebaseApp)

if (useEmulator) {
  connectFirestoreEmulator(db, 'localhost', 8080)
}

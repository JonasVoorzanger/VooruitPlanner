import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { usePlannerStore } from '../stores/planner'

// Feedback van leerlingen, anoniem. Alleen beheerders van de school kunnen het
// lezen; zie firestore.rules.
export async function sendFeedback(message, context = {}) {
  await addDoc(collection(db, 'feedback'), {
    message,
    context,
    schoolId: usePlannerStore().schoolId,
    createdAt: serverTimestamp(),
  })
}

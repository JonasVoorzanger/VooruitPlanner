import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore'
import { firebaseApp } from '../firebase'

// Feedback van leerlingen, anoniem. Alleen beheerders kunnen het lezen; de
// regels staan in firestore.rules.
export async function sendFeedback(message, context = {}) {
  await addDoc(collection(getFirestore(firebaseApp), 'feedback'), {
    message,
    context,
    createdAt: serverTimestamp(),
  })
}

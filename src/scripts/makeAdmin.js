import { initializeApp } from 'firebase/app'
import { getFirestore, doc, updateDoc } from 'firebase/firestore'

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function makeAdmin(userId) {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      role: 'admin',
    })
    console.log(`Successfully updated user ${userId} to admin role`)
  } catch (error) {
    console.error('Error updating user role:', error)
  }
}

// Get the user ID from command line arguments
const userId = process.argv[2]
if (!userId) {
  console.error('Please provide a user ID as an argument')
  process.exit(1)
}

makeAdmin(userId)

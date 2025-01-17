import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore'

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const clearSubmissions = async () => {
  try {
    console.log('Starting to delete all submissions...')

    // First get all hackathons
    const hackathonsSnapshot = await getDocs(collection(db, 'hackathons'))

    for (const hackathonDoc of hackathonsSnapshot.docs) {
      console.log(`Processing hackathon: ${hackathonDoc.id}`)

      // Get all submissions for this hackathon
      const submissionsSnapshot = await getDocs(
        collection(db, 'hackathons', hackathonDoc.id, 'submissions')
      )

      // Delete each submission
      const deletePromises = submissionsSnapshot.docs.map(async (submissionDoc) => {
        console.log(`Deleting submission: ${submissionDoc.id} from hackathon: ${hackathonDoc.id}`)
        await deleteDoc(doc(db, 'hackathons', hackathonDoc.id, 'submissions', submissionDoc.id))
      })

      await Promise.all(deletePromises)
    }

    console.log('Successfully deleted all submissions')
  } catch (error) {
    console.error('Error deleting submissions:', error)
  }
}

// Execute the function
clearSubmissions()

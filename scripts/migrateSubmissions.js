import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteField,
  updateDoc,
} from 'firebase/firestore'
import 'dotenv/config'

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function migrateSubmissions() {
  try {
    // Get all hackathons
    const hackathonsSnapshot = await getDocs(collection(db, 'hackathons'))

    for (const hackathonDoc of hackathonsSnapshot.docs) {
      const hackathonData = hackathonDoc.data()
      const submissionsToDelete = []

      // Find all fields that are submissions (they should have userId and url)
      for (const [fieldName, fieldValue] of Object.entries(hackathonData)) {
        if (
          fieldValue &&
          typeof fieldValue === 'object' &&
          'userId' in fieldValue &&
          'url' in fieldValue
        ) {
          // This is a submission field
          console.log(`Found submission in hackathon ${hackathonDoc.id}: ${fieldName}`)

          // Create new submission document in subcollection
          const submissionRef = doc(collection(db, 'hackathons', hackathonDoc.id, 'submissions'))
          await setDoc(submissionRef, {
            ...fieldValue,
            hackathonId: hackathonDoc.id,
            status: fieldValue.status || 'pending',
            createdAt: fieldValue.createdAt || new Date(),
          })

          // Mark this field for deletion
          submissionsToDelete.push(fieldName)
        }
      }

      // Remove old submission fields
      if (submissionsToDelete.length > 0) {
        const updateData = {}
        submissionsToDelete.forEach((field) => {
          updateData[field] = deleteField()
        })

        await updateDoc(doc(db, 'hackathons', hackathonDoc.id), updateData)
        console.log(
          `Migrated ${submissionsToDelete.length} submissions for hackathon ${hackathonDoc.id}`
        )
      }
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Error during migration:', error)
  }
}

// Run the migration
migrateSubmissions()

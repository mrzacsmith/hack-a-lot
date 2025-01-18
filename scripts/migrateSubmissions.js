import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import serviceAccount from '../service-account.json' assert { type: 'json' }

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore()

async function migrateSubmissionStatuses() {
  try {
    console.log('Starting submission status migration...')

    // Get all hackathons
    const hackathonsSnapshot = await db.collection('hackathons').get()
    let totalUpdated = 0

    for (const hackathonDoc of hackathonsSnapshot.docs) {
      console.log(`Processing hackathon: ${hackathonDoc.id}`)

      // Get all submissions for this hackathon
      const submissionsSnapshot = await hackathonDoc.ref
        .collection('submissions')
        .where('status', '==', 'pending')
        .get()

      console.log(`Found ${submissionsSnapshot.size} submissions with 'pending' status`)

      // Update each submission
      const batch = db.batch()
      let batchCount = 0

      for (const submissionDoc of submissionsSnapshot.docs) {
        batch.update(submissionDoc.ref, { status: 'Submitted' })
        batchCount++
        totalUpdated++

        // Firestore batches are limited to 500 operations
        if (batchCount === 500) {
          await batch.commit()
          console.log('Committed batch of 500 updates')
          batchCount = 0
        }
      }

      // Commit any remaining updates
      if (batchCount > 0) {
        await batch.commit()
        console.log(`Committed final batch of ${batchCount} updates`)
      }
    }

    console.log(`Migration complete! Updated ${totalUpdated} submissions`)
  } catch (error) {
    console.error('Error during migration:', error)
  }
}

// Run the migration
migrateSubmissionStatuses()

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { config } from '../firebase/config'

// Initialize Firebase
const app = initializeApp(config)
const db = getFirestore(app)

const clearSubmissions = async () => {
  try {
    console.log('Starting to delete all submissions...')
    const submissionsSnapshot = await getDocs(collection(db, 'submissions'))

    const deletePromises = submissionsSnapshot.docs.map(async (document) => {
      console.log(`Deleting submission: ${document.id}`)
      await deleteDoc(doc(db, 'submissions', document.id))
    })

    await Promise.all(deletePromises)
    console.log('Successfully deleted all submissions')
  } catch (error) {
    console.error('Error deleting submissions:', error)
  }
}

// Execute the function
clearSubmissions()

import { useState, useEffect } from 'react'
import { getAuth } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'

const Logs = () => {
  const [isAdmin, setIsAdmin] = useState(false)
  const auth = getAuth()

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true)
        }
      }
    }

    checkAdminStatus()
  }, [auth.currentUser])

  if (!isAdmin) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Logs</h1>
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">System Logs</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="text-gray-600">Log viewer coming soon...</p>
      </div>
    </div>
  )
}

export default Logs 
import { useState, useEffect } from 'react'
import { getAuth } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'

const AdminPromotion = () => {
  const [userId, setUserId] = useState(null)
  const [currentRole, setCurrentRole] = useState(null)
  const auth = getAuth()

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        setUserId(auth.currentUser.uid)
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
        if (userDoc.exists()) {
          setCurrentRole(userDoc.data().role)
        }
      }
    }
    fetchUserData()
  }, [auth.currentUser])

  const makeAdmin = async () => {
    if (!userId) {
      toast.error('No user ID found')
      return
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'admin'
      })
      setCurrentRole('admin')
      toast.success('Successfully promoted to admin!')
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Failed to update role')
    }
  }

  if (!userId) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Admin Promotion</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Your User ID:</p>
          <p className="font-mono bg-gray-100 p-2 rounded">{userId}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Current Role:</p>
          <p className="font-semibold capitalize">{currentRole || 'Loading...'}</p>
        </div>
        {currentRole !== 'admin' && (
          <button
            onClick={makeAdmin}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Promote to Admin
          </button>
        )}
      </div>
    </div>
  )
}

export default AdminPromotion
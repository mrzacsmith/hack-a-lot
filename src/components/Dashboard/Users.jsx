import { useState, useEffect } from 'react'
import { getAuth } from 'firebase/auth'
import { doc, getDoc, updateDoc, collection, getDocs, setDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'

const Users = () => {
  const [users, setUsers] = useState([])
  const [currentUserRole, setCurrentUserRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, user, reviewer, admin
  const auth = getAuth()

  useEffect(() => {
    const fetchData = async () => {
      if (auth.currentUser) {
        try {
          // Get current user's role
          const userRef = doc(db, 'users', auth.currentUser.uid)
          const userDoc = await getDoc(userRef)

          // If user document doesn't exist, create it
          if (!userDoc.exists()) {
            const userData = {
              email: auth.currentUser.email,
              role: 'user',
              createdAt: new Date().toISOString()
            }
            await setDoc(userRef, userData)
            setCurrentUserRole('user')
          } else {
            setCurrentUserRole(userDoc.data().role)
          }

          // If user is admin or super admin, fetch all users
          const isAdmin = userDoc.exists() && userDoc.data().role === 'admin'
          const isSuperAdmin = auth.currentUser.email === import.meta.env.VITE_SUPER_ADMIN_EMAIL

          if (isAdmin || isSuperAdmin) {
            const usersSnapshot = await getDocs(collection(db, 'users'))
            const usersData = usersSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            setUsers(usersData)
          }
        } catch (error) {
          console.error('Error fetching data:', error)
          toast.error('Error loading user data')
        }

        setIsLoading(false)
      }
    }
    fetchData()
  }, [auth.currentUser])

  const updateUserRole = async (userId, newRole) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        role: newRole
      })

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ))

      toast.success(`Successfully updated user role to ${newRole}`)
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Failed to update role')
    }
  }

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true
    return user.role === filter
  })

  if (currentUserRole !== 'admin' && auth.currentUser?.email !== import.meta.env.VITE_SUPER_ADMIN_EMAIL) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Users</h1>
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Users</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Users</h1>

      {/* Filter buttons */}
      <div className="flex space-x-2 mb-4">
        {['all', 'user', 'reviewer', 'admin'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${filter === filterOption
              ? 'bg-indigo-100 text-indigo-800'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
          >
            {filterOption === 'all' ? 'All Users' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1) + 's'}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {user.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      disabled={
                        // Disable if:
                        // 1. It's the current user
                        // 2. The target user is an admin and current user is not super admin
                        user.id === auth.currentUser.uid ||
                        (user.role === 'admin' && auth.currentUser.email !== import.meta.env.VITE_SUPER_ADMIN_EMAIL)
                      }
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100"
                    >
                      <option value="user">User</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Users 
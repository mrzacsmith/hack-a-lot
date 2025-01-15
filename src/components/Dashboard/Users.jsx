import { useState, useEffect } from 'react'
import { getAuth } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'

const Users = () => {
  const [users, setUsers] = useState([])
  const [currentUserRole, setCurrentUserRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const auth = getAuth()

  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
        if (userDoc.exists()) {
          setCurrentUserRole(userDoc.data().role)
        }
      }
    }

    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setUsers(usersList)
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Error loading users')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrentUserRole()
    fetchUsers()
  }, [auth.currentUser])

  const handleRoleChange = async (userId, newRole) => {
    if (currentUserRole !== 'admin') {
      toast.error('Only admins can change user roles')
      return
    }

    // Prevent admin from changing their own role
    if (userId === auth.currentUser.uid) {
      toast.error('You cannot change your own role')
      return
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      })

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ))

      toast.success(`User role updated to ${newRole}`)
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Failed to update user role')
    }
  }

  if (currentUserRole !== 'admin') {
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
      <div className="mt-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
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
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {user.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={user.id === auth.currentUser.uid}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
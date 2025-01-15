import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuth, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'

const UserProfile = ({ setIsAuthenticated }) => {
  const [user, setUser] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  const auth = getAuth()

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
        if (userDoc.exists()) {
          setUser({ ...userDoc.data(), id: auth.currentUser.uid })
        }
      }
    }
    fetchUserData()
  }, [auth.currentUser])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setIsAuthenticated(false)
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!user) return null

  return (
    <div className="relative border-t">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
            {user.email[0].toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-gray-400 transform transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isMenuOpen && (
        <div className="absolute bottom-full left-0 w-full bg-white border rounded-t-md shadow-lg">
          <div className="py-1">
            <button
              onClick={() => navigate('/settings')}
              className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfile 
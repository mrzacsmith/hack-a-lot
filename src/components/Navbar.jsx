import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAuth, signOut } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import app from '../firebase/config'

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const auth = getAuth(app)

  useEffect(() => {
    let unsubscribe = () => { }

    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid)
      unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          setUser({ ...doc.data(), id: doc.id })
        }
      })
    }

    return () => unsubscribe()
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

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user?.email
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">HackALot</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
            ) : (
              <Link to="/" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
            )}
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                {/* User Profile */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                        {user?.email?.[0].toUpperCase() || 'U'}
                      </div>
                    )}
                    <span>{getDisplayName()}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 transform transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsProfileOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {isAuthenticated && user && (
              <div className="px-4 py-2 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                      {user?.email?.[0].toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="text-base font-medium text-gray-800">{getDisplayName()}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </div>
            )}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="block px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-100 text-base font-medium"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/"
                className="block px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-100 text-base font-medium"
              >
                Home
              </Link>
            )}
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-100 text-base font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-100 text-base font-medium"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/settings"
                  className="block px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-100 text-base font-medium"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-100 text-base font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar 
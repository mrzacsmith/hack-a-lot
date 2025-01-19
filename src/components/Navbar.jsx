import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAuth, signOut } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import app from '../firebase/config'
import sisuLogo from '../assets/sisu-logo2.png'
import BugReportModal from './BugReportModal'

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isBugModalOpen, setIsBugModalOpen] = useState(false)
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
    <nav className="bg-white w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                src={sisuLogo}
                alt="Sisu Logo"
                className="w-[266px] h-[80px]"
                style={{ objectFit: 'contain' }}
              />
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated && (
              <Link to="/dashboard" className="text-gray-700 hover:text-sisu-blue px-3 py-2 rounded-md text-base font-medium">
                Dashboard
              </Link>
            )}
            <Link to="/about" className="text-gray-700 hover:text-sisu-blue px-3 py-2 rounded-md text-base font-medium">
              What is Sisu?
            </Link>
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-sisu-blue px-3 py-2 rounded-md text-base font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-sisu-blue text-white hover:bg-sisu-blue-dark hover:text-black shadow-sm hover:shadow-md px-4 py-2 rounded-md text-base font-medium transition-all duration-200"
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
                    className="flex items-center space-x-2 text-gray-700 hover:text-sisu-blue hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium"
                  >
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-sisu-blue font-medium ring-2 ring-gray-200">
                        {user?.email?.[0].toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-gray-700">{getDisplayName()}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 text-gray-400 transform transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
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
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-sisu-blue"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </div>
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsProfileOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-sisu-blue"
                      >
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </div>
                      </button>
                      <div className="px-4 py-2 text-xs text-gray-500 border-t">
                        <div className="flex items-center justify-between">
                          <div className="relative group">
                            <button
                              onClick={() => {
                                setIsBugModalOpen(true)
                                setIsProfileOpen(false)
                              }}
                              className="text-base inline-block hover:text-sisu-blue"
                            >
                              🪲
                            </button>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                              Report a Bug
                            </div>
                          </div>
                          <div className="italic">
                            Version {import.meta.env.VITE_APP_VERSION || '1.0.12'}
                          </div>
                        </div>
                      </div>
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
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-sisu-blue hover:bg-blue-50"
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
                    <div className="h-10 w-10 rounded-full bg-sisu-blue flex items-center justify-center text-white font-medium">
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
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="block px-3 py-2 text-gray-700 hover:text-sisu-blue hover:bg-blue-50 text-base font-medium"
              >
                Dashboard
              </Link>
            )}
            <Link
              to="/about"
              className="block px-3 py-2 text-gray-700 hover:text-sisu-blue hover:bg-blue-50 text-base font-medium"
            >
              What is Sisu?
            </Link>
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-700 hover:text-sisu-blue hover:bg-blue-50 text-base font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-gray-700 hover:text-sisu-blue hover:bg-blue-50 text-base font-medium"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/settings"
                  className="block px-3 py-2 text-gray-700 hover:text-sisu-blue hover:bg-blue-50 text-base font-medium"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-sisu-blue hover:bg-blue-50 text-base font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
      />
    </nav>
  )
}

export default Navbar 
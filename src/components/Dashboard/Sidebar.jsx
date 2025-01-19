import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getAuth } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState(null)
  const [hasUnviewedComments, setHasUnviewedComments] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const auth = getAuth()

  useEffect(() => {
    const fetchUserRole = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role)
        }
      }
    }
    fetchUserRole()
  }, [auth.currentUser])

  useEffect(() => {
    if (!auth.currentUser) return

    const unsubscribers = []

    const setupReviewListeners = async () => {
      try {
        // Get all hackathons
        const hackathonsSnapshot = await getDocs(collection(db, 'hackathons'))

        for (const hackathonDoc of hackathonsSnapshot.docs) {
          // Get submissions where user is the owner
          const submissionsRef = collection(db, 'hackathons', hackathonDoc.id, 'submissions')
          const submissionsQuery = query(submissionsRef, where('userId', '==', auth.currentUser.uid))

          // Listen to submissions and their reviews
          const submissionsUnsubscribe = onSnapshot(submissionsQuery, async (submissionsSnapshot) => {
            let foundUnviewed = false

            for (const submissionDoc of submissionsSnapshot.docs) {
              if (foundUnviewed) break

              // Set up real-time listener for reviews
              const reviewsRef = collection(db, 'hackathons', hackathonDoc.id, 'submissions', submissionDoc.id, 'reviews')
              const reviewsUnsubscribe = onSnapshot(reviewsRef, async (reviewsSnapshot) => {
                if (foundUnviewed) return

                for (const reviewDoc of reviewsSnapshot.docs) {
                  if (foundUnviewed) break

                  // Check if review is viewed
                  const viewedRef = doc(db, 'users', auth.currentUser.uid, 'viewedReviews', reviewDoc.id)
                  const viewedDoc = await getDoc(viewedRef)

                  if (!viewedDoc.exists()) {
                    foundUnviewed = true
                    setHasUnviewedComments(true)
                    break
                  }
                }

                if (!foundUnviewed) {
                  setHasUnviewedComments(false)
                }
              })
              unsubscribers.push(reviewsUnsubscribe)
            }
          })
          unsubscribers.push(submissionsUnsubscribe)
        }
      } catch (error) {
        console.error('Error setting up review listeners:', error)
      }
    }

    setupReviewListeners()

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [auth.currentUser])

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

  // Define which roles can access each navigation item
  const canAccess = (allowedRoles) => {
    if (!allowedRoles) return true // If no roles specified, everyone can access
    if (!userRole) return false // If user role not loaded, deny access
    return allowedRoles.includes(userRole)
  }

  const navigation = [
    {
      name: 'Overview',
      href: '/dashboard',
      allowedRoles: ['user', 'reviewer', 'admin'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      name: 'Submissions',
      href: '/dashboard/submissions',
      allowedRoles: ['user', 'reviewer', 'admin'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      showNew: hasUnviewedComments && userRole === 'user'
    },
    {
      name: 'Reviews',
      href: '/dashboard/reviews',
      allowedRoles: ['admin', 'reviewer'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ),
    },
    {
      name: 'Hackathons',
      href: '/dashboard/hackathons',
      allowedRoles: ['admin'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Logs',
      href: '/dashboard/logs',
      allowedRoles: ['admin'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Users',
      href: '/dashboard/users',
      allowedRoles: ['admin'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    }
  ]

  const handleSubmissionsClick = (item) => {
    if (item.name === 'Submissions') {
      if (item.showNew) {
        // Only pass fromNew state when clicking NEW
        navigate(item.href, { state: { fromNew: true } })
      } else {
        // Regular navigation for non-NEW clicks
        navigate(item.href)
      }
    } else {
      navigate(item.href)
    }
  }

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-gray-100">
      <div className="flex items-center flex-shrink-0 px-4 py-5">
        <span className="text-xl font-bold text-indigo-600">Dashboard</span>
      </div>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {navigation
          .filter(item => canAccess(item.allowedRoles))
          .map((item) => {
            const isActive = location.pathname === item.href
            return (
              <button
                key={item.name}
                onClick={() => handleSubmissionsClick(item)}
                className={`group flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-500 bg-white hover:bg-gray-50 hover:text-indigo-600'
                  }`}
              >
                <div className="flex items-center">
                  <div
                    className={`mr-3 flex-shrink-0 transition-colors ${isActive
                      ? 'text-indigo-600'
                      : 'text-gray-400 group-hover:text-indigo-600'
                      }`}
                  >
                    {item.icon}
                  </div>
                  {item.name}
                </div>
                {item.showNew && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-600">
                    NEW
                  </span>
                )}
              </button>
            )
          })}
      </nav>
    </div>
  )
}

export default Sidebar 
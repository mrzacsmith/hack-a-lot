import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, query, where, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'

const Submissions = () => {
  const [url, setUrl] = useState('')
  const [selectedHackathon, setSelectedHackathon] = useState('')
  const [registeredHackathons, setRegisteredHackathons] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const auth = getAuth()

  useEffect(() => {
    if (!auth.currentUser) {
      setSubmissions([])
      setUserRole(null)
      return
    }

    fetchUserRole(auth.currentUser.uid)
    fetchSubmissions()
    fetchRegisteredHackathons()
  }, [])

  const fetchRegisteredHackathons = async () => {
    try {
      // Get all hackathons where user is a participant
      const hackathonsQuery = query(
        collection(db, 'hackathons'),
        where('participants', 'array-contains', auth.currentUser.uid)
      )
      const hackathonsSnapshot = await getDocs(hackathonsQuery)
      const hackathonsList = hackathonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate.toDate()
      }))
      console.log('Fetched hackathons:', hackathonsList) // Debug log
      setRegisteredHackathons(hackathonsList)
    } catch (error) {
      console.error('Error fetching registered hackathons:', error)
      toast.error('Failed to load registered hackathons')
    }
  }

  const fetchUserRole = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role)
      } else {
        const userData = {
          email: auth.currentUser.email,
          role: 'user',
          createdAt: new Date().toISOString()
        }
        await setDoc(doc(db, 'users', userId), userData)
        setUserRole('user')
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      setUserRole('user')
    }
  }

  const fetchSubmissions = async () => {
    try {
      if (!auth.currentUser) return

      const userId = auth.currentUser.uid
      const userDoc = await getDoc(doc(db, 'users', userId))
      const role = userDoc.exists() ? userDoc.data()?.role : 'user'

      // First get all hackathons the user is registered for
      const hackathonsQuery = query(
        collection(db, 'hackathons'),
        where('participants', 'array-contains', userId)
      )
      const hackathonsSnapshot = await getDocs(hackathonsQuery)

      const submissionsList = []

      // For each hackathon, get its submissions
      for (const hackathonDoc of hackathonsSnapshot.docs) {
        const hackathonData = hackathonDoc.data()
        const submissionsRef = collection(db, 'hackathons', hackathonDoc.id, 'submissions')

        // Query submissions based on user role
        const submissionsQuery = role === 'admin' || role === 'reviewer'
          ? submissionsRef
          : query(submissionsRef, where('userId', '==', userId))

        const submissionsSnapshot = await getDocs(submissionsQuery)

        // Add each submission with its hackathon data
        submissionsSnapshot.docs.forEach(doc => {
          const data = doc.data()
          if (data) {
            submissionsList.push({
              id: doc.id,
              ...data,
              hackathon: {
                id: hackathonDoc.id,
                title: hackathonData.title,
                status: hackathonData.status
              }
            })
          }
        })
      }

      // Sort submissions by date
      setSubmissions(submissionsList.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      ))
      setUserRole(role)
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast.error('Error loading submissions')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const submitPromise = new Promise(async (resolve, reject) => {
      try {
        if (!selectedHackathon) {
          throw new Error('Please select a hackathon')
        }

        // Basic URL validation
        const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+\/?)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/
        if (!urlPattern.test(url)) {
          throw new Error('Please enter a valid URL')
        }

        const hackathon = registeredHackathons.find(h => h.id === selectedHackathon)
        if (!hackathon) {
          throw new Error('Selected hackathon not found')
        }

        // Check if hackathon is active
        const now = new Date()
        if (now < hackathon.startDate) {
          throw new Error('This hackathon has not started yet')
        }
        if (now > hackathon.endDate) {
          throw new Error('This hackathon has ended')
        }

        const user = auth.currentUser

        // Create submission in the hackathon's submissions subcollection
        await addDoc(collection(db, 'hackathons', selectedHackathon, 'submissions'), {
          url,
          hackathonId: selectedHackathon,
          userId: user.uid,
          userEmail: user.email,
          createdAt: serverTimestamp(),
          status: 'pending'
        })

        setUrl('')
        setSelectedHackathon('')
        fetchSubmissions()
        resolve('Project submitted successfully!')
      } catch (error) {
        setError(error.message)
        reject(error.message)
      } finally {
        setIsSubmitting(false)
      }
    })

    toast.promise(submitPromise, {
      loading: 'Submitting project...',
      success: (message) => message,
      error: (error) => error,
    })
  }

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }

  return (
    <div className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            {userRole === 'admin' || userRole === 'reviewer' ? 'All Submissions' : 'Your Submissions'}
          </h1>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
          <div className="px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              {/* Hackathon Selection */}
              <div>
                <label htmlFor="hackathon" className="block text-sm font-medium text-gray-700">
                  Select Hackathon
                </label>
                {registeredHackathons.length > 0 ? (
                  <select
                    id="hackathon"
                    value={selectedHackathon}
                    onChange={(e) => setSelectedHackathon(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="">Select a hackathon</option>
                    {registeredHackathons.map(hackathon => {
                      const now = new Date()
                      const isActive = now >= hackathon.startDate && now <= hackathon.endDate
                      return (
                        <option
                          key={hackathon.id}
                          value={hackathon.id}
                          disabled={!isActive}
                        >
                          {hackathon.title} ({isActive ? 'Active' : 'Not Active'}) - {formatDateTime(hackathon.startDate)} to {formatDateTime(hackathon.endDate)}
                        </option>
                      )
                    })}
                  </select>
                ) : (
                  <div className="mt-1 text-sm text-gray-500">
                    You are not registered for any hackathons. Please register for a hackathon first.
                  </div>
                )}
                {registeredHackathons.length > 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    Note: You can only submit to hackathons that are currently active (between start and end dates).
                  </p>
                )}
              </div>

              {/* Project URL Input */}
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  Project URL
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="https://github.com/username/project"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !registeredHackathons.some(h => {
                    const now = new Date()
                    return now >= h.startDate && now <= h.endDate
                  })}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${(isSubmitting || !registeredHackathons.some(h => {
                    const now = new Date()
                    return now >= h.startDate && now <= h.endDate
                  }))
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                    }`}
                >
                  {isSubmitting
                    ? 'Submitting...'
                    : !registeredHackathons.some(h => {
                      const now = new Date()
                      return now >= h.startDate && now <= h.endDate
                    })
                      ? 'No Active Hackathons'
                      : 'Submit Project'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Submissions List */}
        <div className="flex-1 bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {submissions.length === 0 ? (
              <li className="px-6 py-4">
                <p className="text-gray-500">No submissions yet</p>
              </li>
            ) : (
              submissions.map((submission) => (
                <li key={submission.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={submission.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={(e) => {
                            e.preventDefault()
                            window.open(submission.url, '_blank', 'noopener,noreferrer')
                          }}
                        >
                          {new URL(submission.url).hostname}
                          <span className="ml-1 text-gray-500">↗</span>
                        </a>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${submission.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                          }`}>
                          {submission.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Submitted by {submission.userEmail} on{' '}
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                      {submission.hackathon && (
                        <p className="text-sm text-gray-500 mt-1">
                          Hackathon: {submission.hackathon.title}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Submissions 
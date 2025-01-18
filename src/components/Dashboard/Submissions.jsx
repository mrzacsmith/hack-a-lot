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
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
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

      const hackathonsQuery = query(
        collection(db, 'hackathons'),
        where('participants', 'array-contains', userId)
      )
      const hackathonsSnapshot = await getDocs(hackathonsQuery)

      const submissionsList = []

      for (const hackathonDoc of hackathonsSnapshot.docs) {
        const hackathonData = hackathonDoc.data()
        const submissionsRef = collection(db, 'hackathons', hackathonDoc.id, 'submissions')

        const submissionsQuery = query(submissionsRef, where('userId', '==', userId))
        const submissionsSnapshot = await getDocs(submissionsQuery)

        // Add each submission with its reviews
        for (const doc of submissionsSnapshot.docs) {
          const data = doc.data()
          if (data) {
            // Fetch reviews for this submission
            const reviewsRef = collection(db, 'hackathons', hackathonDoc.id, 'submissions', doc.id, 'reviews')
            const reviewsSnapshot = await getDocs(reviewsRef)
            const reviews = reviewsSnapshot.docs.map(reviewDoc => ({
              id: reviewDoc.id,
              ...reviewDoc.data(),
              createdAt: reviewDoc.data().createdAt?.toDate() || new Date()
            }))

            submissionsList.push({
              id: doc.id,
              ...data,
              reviews,
              hackathon: {
                id: hackathonDoc.id,
                title: hackathonData.title,
                status: hackathonData.status
              }
            })
          }
        }
      }

      setSubmissions(submissionsList.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      ))
      setUserRole(role)
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast.error('Error loading submissions')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted':
        return 'bg-yellow-100 text-yellow-800'
      case 'In Review':
        return 'bg-blue-100 text-blue-800'
      case 'Commented':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

        // Check if user already has a submission for this hackathon
        const submissionsRef = collection(db, 'hackathons', selectedHackathon, 'submissions')
        const existingSubmissionQuery = query(submissionsRef, where('userId', '==', user.uid))
        const existingSubmissionSnapshot = await getDocs(existingSubmissionQuery)

        if (!existingSubmissionSnapshot.empty) {
          throw new Error('You already have a submission for this hackathon')
        }

        // Create submission with initial status
        await addDoc(collection(db, 'hackathons', selectedHackathon, 'submissions'), {
          url,
          hackathonId: selectedHackathon,
          userId: user.uid,
          userEmail: user.email,
          createdAt: serverTimestamp(),
          status: 'Submitted'
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

  const formatDateTime = (timestamp) => {
    try {
      // Handle Firestore Timestamp
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)

      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date)
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Date unavailable'
    }
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
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {submissions.map((submission) => (
              <li key={submission.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {submission.url}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Submitted for: {submission.hackathon.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Submitted on: {submission.createdAt ? formatDateTime(submission.createdAt) : 'Date unavailable'}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center space-x-4">
                    <button
                      onClick={() => {
                        setSelectedSubmission(submission)
                        setReviewModalOpen(true)
                      }}
                      className="text-gray-400 hover:text-gray-500"
                      title="View Reviews"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-1 text-sm">
                        {submission.reviews?.length || 0}
                      </span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Reviews Modal */}
        {reviewModalOpen && selectedSubmission && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Reviews for Submission
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSubmission.status)}`}>
                          {selectedSubmission.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-4">
                          Submission URL: {selectedSubmission.url}
                        </p>
                        {selectedSubmission.reviews?.length > 0 ? (
                          <div className="space-y-4">
                            {selectedSubmission.reviews.map((review) => (
                              <div key={review.id} className="border-b pb-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium">
                                      Score: {review.score}/100
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {review.comment}
                                    </p>
                                  </div>
                                  <p className="text-xs text-gray-400">
                                    {review.createdAt ? formatDateTime(review.createdAt) : 'Date unavailable'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No reviews yet for this submission.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setReviewModalOpen(false)
                      setSelectedSubmission(null)
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Submissions 
import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, query, where, doc, getDoc, setDoc, serverTimestamp, updateDoc, onSnapshot } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'

const Submissions = () => {
  const [url, setUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [deployedUrl, setDeployedUrl] = useState('')
  const [selectedHackathon, setSelectedHackathon] = useState('')
  const [registeredHackathons, setRegisteredHackathons] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const auth = getAuth()
  const location = useLocation()
  const [unviewedSubmissions, setUnviewedSubmissions] = useState([])
  const [termsAgreed, setTermsAgreed] = useState(false)

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

  useEffect(() => {
    if (!auth.currentUser) return

    // Set up real-time listener for submissions and their reviews
    const unsubscribe = onSnapshot(
      query(collection(db, 'hackathons')),
      async (hackathonsSnapshot) => {
        const submissionsList = []
        const unsubscribers = []

        for (const hackathonDoc of hackathonsSnapshot.docs) {
          const submissionsRef = collection(db, 'hackathons', hackathonDoc.id, 'submissions')
          const submissionsQuery = query(submissionsRef, where('userId', '==', auth.currentUser.uid))

          // Set up real-time listener for each submission
          const submissionUnsubscribe = onSnapshot(submissionsQuery, async (submissionsSnapshot) => {
            for (const doc of submissionsSnapshot.docs) {
              const data = doc.data()
              if (data) {
                // Set up real-time listener for reviews
                const reviewsRef = collection(db, 'hackathons', hackathonDoc.id, 'submissions', doc.id, 'reviews')
                const reviewsUnsubscribe = onSnapshot(reviewsRef, (reviewsSnapshot) => {
                  const reviews = reviewsSnapshot.docs.map(reviewDoc => ({
                    id: reviewDoc.id,
                    ...reviewDoc.data(),
                    createdAt: reviewDoc.data().createdAt?.toDate() || new Date()
                  }))

                  const submission = {
                    id: doc.id,
                    ...data,
                    reviews,
                    hackathon: {
                      id: hackathonDoc.id,
                      title: hackathonDoc.data().title,
                      status: hackathonDoc.data().status
                    }
                  }

                  // Update submissions list
                  setSubmissions(prev => {
                    const newList = prev.filter(s => s.id !== doc.id)
                    return [...newList, submission].sort((a, b) =>
                      new Date(b.createdAt) - new Date(a.createdAt)
                    )
                  })
                })
                unsubscribers.push(reviewsUnsubscribe)
              }
            }
          })
          unsubscribers.push(submissionUnsubscribe)
        }

        // Cleanup function
        return () => {
          unsubscribers.forEach(unsub => unsub())
        }
      }
    )

    return () => unsubscribe()
  }, [auth.currentUser])

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
          throw new Error('Please enter a valid project URL')
        }

        // Optional URL validation
        if (videoUrl && !urlPattern.test(videoUrl)) {
          throw new Error('Please enter a valid video URL')
        }
        if (deployedUrl && !urlPattern.test(deployedUrl)) {
          throw new Error('Please enter a valid deployed URL')
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
          videoUrl: videoUrl || null,
          deployedUrl: deployedUrl || null,
          hackathonId: selectedHackathon,
          userId: user.uid,
          userEmail: user.email,
          createdAt: serverTimestamp(),
          status: 'Submitted'
        })

        setUrl('')
        setVideoUrl('')
        setDeployedUrl('')
        setSelectedHackathon('')
        setSubmitModalOpen(false)
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

  const markReviewsAsViewed = async (submission) => {
    if (!submission.reviews?.length) return

    try {
      const viewPromises = submission.reviews.map(async (review) => {
        const viewedRef = doc(db, 'users', auth.currentUser.uid, 'viewedReviews', review.id)
        await setDoc(viewedRef, {
          submissionId: submission.id,
          viewedAt: serverTimestamp()
        })
      })
      await Promise.all(viewPromises)

      // Update local state
      setUnviewedSubmissions(prev => prev.filter(s => s.id !== submission.id))
    } catch (error) {
      console.error('Error marking reviews as viewed:', error)
    }
  }

  // Separate handlers for opening reviews
  const openReviewModal = (submission) => {
    setSelectedSubmission(submission)
    setReviewModalOpen(true)
  }

  const openReviewFromNew = (submission) => {
    setSelectedSubmission(submission)
    setReviewModalOpen(true)
    markReviewsAsViewed(submission)
  }

  useEffect(() => {
    // Only open reviews if we came from clicking NEW
    if (location.state?.fromNew && unviewedSubmissions.length > 0) {
      openReviewFromNew(unviewedSubmissions[0])
    }
  }, [location.state?.fromNew, unviewedSubmissions])

  return (
    <div className="h-full bg-white">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            My Submissions
          </h1>
          <button
            onClick={() => setSubmitModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Submit +
          </button>
        </div>

        {/* Submissions List */}
        <div className="flex-grow">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No submissions yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="bg-white px-4 py-4 sm:px-6 rounded-lg border-2 border-gray-200 hover:border-indigo-200 shadow-md hover:shadow-lg transition-all">
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
                      <div className="mt-2 space-y-1">
                        {submission.videoUrl && (
                          <p className="text-sm text-gray-500">
                            Video: <a href={submission.videoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline">{submission.videoUrl}</a>
                          </p>
                        )}
                        {submission.deployedUrl && (
                          <p className="text-sm text-gray-500">
                            Deployed at: <a href={submission.deployedUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline">{submission.deployedUrl}</a>
                          </p>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
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
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
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
                        <span className="ml-1 text-sm text-gray-600">
                          {submission.reviews?.length || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Modal */}
        {submitModalOpen && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-100 bg-opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-[600px]">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Submit Project
                      </h3>
                      <div className="mt-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                      {hackathon.title} ({isActive ? 'Active' : 'Not Active'})
                                    </option>
                                  )
                                })}
                              </select>
                            ) : (
                              <div className="mt-1 text-sm text-gray-500">
                                You are not registered for any hackathons. Please register for a hackathon first.
                              </div>
                            )}
                          </div>

                          {/* Project URL Input */}
                          <div>
                            <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                              Project URL (Required)
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="url"
                                id="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="https://github.com/username/project"
                                required
                              />
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Your project's repository URL (e.g., GitHub, GitLab)</p>
                          </div>

                          {/* Video URL Input */}
                          <div>
                            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700">
                              Video URL (Optional)
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="videoUrl"
                                id="videoUrl"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="https://youtube.com/..."
                              />
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Link to your demo video</p>
                          </div>

                          {/* Deployed URL Input */}
                          <div>
                            <label htmlFor="deployedUrl" className="block text-sm font-medium text-gray-700">
                              Deployed URL (Optional)
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="deployedUrl"
                                id="deployedUrl"
                                value={deployedUrl}
                                onChange={(e) => setDeployedUrl(e.target.value)}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="https://your-app.com"
                              />
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Link to your deployed application</p>
                          </div>

                          {/* Terms Agreement Checkbox */}
                          <div className="mt-4">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="termsAgreement"
                                checked={termsAgreed}
                                onChange={(e) => setTermsAgreed(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                required
                              />
                              <label htmlFor="termsAgreement" className="ml-2 block text-sm text-gray-700">
                                I agree to the terms and conditions of this event
                              </label>
                            </div>
                          </div>

                          {/* Error Message */}
                          {error && (
                            <div className="text-red-600 text-sm mt-2">
                              {error}
                            </div>
                          )}

                          {/* Modal Footer */}
                          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                              type="submit"
                              disabled={isSubmitting || !registeredHackathons.some(h => {
                                const now = new Date()
                                return now >= h.startDate && now <= h.endDate
                              }) || !termsAgreed}
                              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${(isSubmitting || !registeredHackathons.some(h => {
                                const now = new Date()
                                return now >= h.startDate && now <= h.endDate
                              }) || !termsAgreed)
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                                }`}
                            >
                              {isSubmitting ? 'Submitting...' : 'Submit Project'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSubmitModalOpen(false)
                                setError('')
                                setUrl('')
                                setVideoUrl('')
                                setDeployedUrl('')
                                setSelectedHackathon('')
                                setTermsAgreed(false)
                              }}
                              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Modal */}
        {reviewModalOpen && selectedSubmission && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-100 bg-opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-[600px]">
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
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-200 px-4 py-2 bg-white text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                    onClick={async () => {
                      await markReviewsAsViewed(selectedSubmission)
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
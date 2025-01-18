import { useState, useEffect } from 'react'
import { getAuth } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'

const Reviews = () => {
  const [submissions, setSubmissions] = useState([])
  const [currentUserRole, setCurrentUserRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [submissionToDelete, setSubmissionToDelete] = useState(null)
  const [hackathons, setHackathons] = useState([])
  const [selectedHackathon, setSelectedHackathon] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [score, setScore] = useState(0)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const auth = getAuth()

  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
        if (userDoc.exists()) {
          const role = userDoc.data().role
          setCurrentUserRole(role)
          // Only fetch hackathons if user is admin or reviewer
          if (role === 'admin' || role === 'reviewer') {
            fetchHackathons()
          }
        }
      }
    }

    const fetchHackathons = async () => {
      try {
        const hackathonsSnapshot = await getDocs(collection(db, 'hackathons'))
        const now = new Date()
        const hackathonsList = hackathonsSnapshot.docs.map(doc => {
          const data = doc.data()
          const startDate = data.startDate.toDate()
          const endDate = data.endDate.toDate()
          const status = now < startDate
            ? 'pending'
            : now > endDate
              ? 'completed'
              : 'active'

          return {
            id: doc.id,
            ...data,
            startDate,
            endDate,
            status
          }
        })

        // Sort hackathons: active first, then pending by start date, then completed
        const sortedHackathons = hackathonsList.sort((a, b) => {
          // Different status - sort by status priority
          if (a.status !== b.status) {
            const statusPriority = { active: 0, pending: 1, completed: 2 }
            return statusPriority[a.status] - statusPriority[b.status]
          }

          // Same status - sort by relevant date
          if (a.status === 'pending') {
            // For pending, sort by closest start date first
            return a.startDate - b.startDate
          } else if (a.status === 'completed') {
            // For completed, sort by most recently ended first
            return b.endDate - a.endDate
          }
          // For active, sort by end date (closest to ending first)
          return a.endDate - b.endDate
        })

        setHackathons(sortedHackathons)
      } catch (error) {
        console.error('Error fetching hackathons:', error)
        toast.error('Failed to load hackathons')
      }
    }

    fetchCurrentUserRole()
  }, [auth.currentUser])

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!selectedHackathon) {
        setSubmissions([])
        return
      }

      setIsLoading(true)
      try {
        // Debug logs
        console.log('Debug info:')
        console.log('Auth user:', auth.currentUser?.uid)
        console.log('Current user role:', currentUserRole)
        console.log('Selected hackathon:', selectedHackathon)

        // Get user document to verify role
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
        console.log('User doc data:', userDoc.data())

        // Get hackathon document to verify it exists
        const hackathonDoc = await getDoc(doc(db, 'hackathons', selectedHackathon))
        console.log('Hackathon exists:', hackathonDoc.exists())

        // Get all submissions for the selected hackathon
        const submissionsRef = collection(db, 'hackathons', selectedHackathon, 'submissions')
        console.log('Attempting to fetch submissions from path:', submissionsRef.path)
        const submissionsSnapshot = await getDocs(submissionsRef)
        console.log('Submissions fetched:', submissionsSnapshot.docs.length)

        const submissionsWithDetails = await Promise.all(
          submissionsSnapshot.docs.map(async (submissionDoc) => {
            const data = submissionDoc.data()
            console.log('Submission data:', data)
            const userDoc = await getDoc(doc(db, 'users', data.userId))

            // Get all reviews for this submission
            const reviewsRef = collection(db, 'hackathons', selectedHackathon, 'submissions', submissionDoc.id, 'reviews')
            const reviewsSnapshot = await getDocs(reviewsRef)

            const reviews = reviewsSnapshot.docs.map(reviewDoc => ({
              id: reviewDoc.id,
              ...reviewDoc.data(),
              createdAt: reviewDoc.data().createdAt?.toDate() || new Date()
            }))

            return {
              id: submissionDoc.id,
              ...data,
              userEmail: userDoc.exists() ? userDoc.data().email : 'Unknown',
              reviews: reviews
            }
          })
        )

        setSubmissions(submissionsWithDetails)
      } catch (error) {
        console.error('Detailed error:', error)
        console.error('Error stack:', error.stack)
        toast.error('Error loading submissions')
      } finally {
        setIsLoading(false)
      }
    }

    if (selectedHackathon) {
      fetchSubmissions()
    }
  }, [selectedHackathon, currentUserRole, auth.currentUser])

  const handleAddReview = async () => {
    if (!selectedSubmission || !reviewComment.trim() || score < 0 || score > 100) {
      toast.error('Please provide a valid review and score (0-100)')
      return
    }

    try {
      const reviewData = {
        reviewerId: auth.currentUser.uid,
        comment: reviewComment.trim(),
        score: score,
        createdAt: serverTimestamp(),
        hackathonId: selectedHackathon
      }

      // Use proper document references
      const reviewsRef = collection(db, 'hackathons', selectedHackathon, 'submissions', selectedSubmission.id, 'reviews')
      await addDoc(reviewsRef, reviewData)

      // Refresh reviews for this submission
      const reviewsSnapshot = await getDocs(reviewsRef)
      const reviews = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))

      // Update local state
      setSubmissions(submissions.map(sub =>
        sub.id === selectedSubmission.id
          ? { ...sub, reviews: reviews }
          : sub
      ))

      setReviewComment('')
      setScore(0)
      setReviewModalOpen(false)
      setSelectedSubmission(null)
      toast.success('Review added successfully')
    } catch (error) {
      console.error('Error adding review:', error)
      toast.error('Failed to add review')
    }
  }

  const openReviewModal = (submission) => {
    setSelectedSubmission(submission)
    setReviewModalOpen(true)
  }

  if (!currentUserRole || (currentUserRole !== 'admin' && currentUserRole !== 'reviewer')) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Reviews</h1>
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h1>

      {/* Hackathon Selector */}
      <div className="mb-6">
        <label htmlFor="hackathon" className="block text-sm font-medium text-gray-700">
          Select Hackathon
        </label>
        <select
          id="hackathon"
          value={selectedHackathon}
          onChange={(e) => setSelectedHackathon(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Select a hackathon...</option>
          {hackathons.map((hackathon) => {
            const now = new Date()
            const status = now < hackathon.startDate
              ? 'pending'
              : now > hackathon.endDate
                ? 'completed'
                : 'active'

            let statusText = ''
            if (status === 'active') {
              statusText = ' (Active)'
            } else if (status === 'completed') {
              statusText = ' (Completed)'
            } else {
              statusText = ` (Starting ${hackathon.startDate.toLocaleDateString()})`
            }

            return (
              <option key={hackathon.id} value={hackathon.id}>
                {hackathon.title}{statusText}
              </option>
            )
          })}
        </select>
      </div>

      {isLoading && selectedHackathon ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : !selectedHackathon ? (
        <p className="text-gray-500 text-center">Please select a hackathon to view submissions</p>
      ) : submissions.length === 0 ? (
        <p className="text-gray-500 text-center">No submissions found for this hackathon</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {submissions.map((submission) => (
              <li key={submission.id} className="p-6">
                <div className="space-y-4">
                  {/* Submission Details */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
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
                          <span className="ml-1">↗</span>
                        </a>
                      </h3>
                      <p className="text-sm text-gray-500">
                        Submitted by {submission.userEmail} on{' '}
                        {submission.createdAt?.toDate?.()?.toLocaleDateString() || new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => openReviewModal(submission)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add Review
                    </button>
                  </div>

                  {/* Reviews List */}
                  {submission.reviews && submission.reviews.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Reviews</h4>
                      <div className="space-y-4">
                        {submission.reviews.map((review) => (
                          <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                Score: {review.score}/100
                              </span>
                              <span className="text-sm text-gray-500">
                                {review.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Add Review
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="score" className="block text-sm font-medium text-gray-700">
                      Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      id="score"
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                      Comment
                    </label>
                    <textarea
                      id="comment"
                      rows={4}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleAddReview}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                >
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReviewModalOpen(false)
                    setSelectedSubmission(null)
                    setReviewComment('')
                    setScore(0)
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reviews 
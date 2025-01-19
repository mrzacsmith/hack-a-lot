import { useState, useEffect } from 'react'
import { getAuth } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'

const Reviews = () => {
  const [submissions, setSubmissions] = useState([])
  const [currentUserRole, setCurrentUserRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hackathons, setHackathons] = useState([])
  const [selectedHackathon, setSelectedHackathon] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [score, setScore] = useState(0)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const auth = getAuth()

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
            ? 'Submitted'
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

        // Sort hackathons: active first, then Submitted by start date, then completed
        const sortedHackathons = hackathonsList.sort((a, b) => {
          // Different status - sort by status priority
          if (a.status !== b.status) {
            const statusPriority = { active: 0, Submitted: 1, completed: 2 }
            return statusPriority[a.status] - statusPriority[b.status]
          }

          // Same status - sort by relevant date
          if (a.status === 'Submitted') {
            // For Submitted, sort by closest start date first
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
            const userData = userDoc.exists() ? userDoc.data() : null

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
              userEmail: userData?.email || 'Unknown',
              firstName: userData?.firstName || '',
              lastName: userData?.lastName || '',
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

  const markReviewAsViewed = async (submissionId, reviewId) => {
    try {
      const viewedRef = doc(db, 'users', auth.currentUser.uid, 'viewedReviews', reviewId)
      await setDoc(viewedRef, {
        submissionId,
        viewedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error marking review as viewed:', error)
    }
  }

  const handleAddReview = async () => {
    if (!selectedSubmission || !reviewComment.trim() || score < 1 || score > 10) {
      toast.error('Please provide a valid review and score (1-10)')
      return
    }

    try {
      // Get reviewer details
      const reviewerDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
      const reviewerData = reviewerDoc.data()

      const reviewData = {
        reviewerId: auth.currentUser.uid,
        reviewerEmail: auth.currentUser.email,
        reviewerName: reviewerData?.firstName ? `${reviewerData.firstName} ${reviewerData.lastName || ''}` : reviewerData?.email,
        comment: reviewComment.trim(),
        score: score,
        createdAt: serverTimestamp(),
        hackathonId: selectedHackathon,
        submissionOwnerId: selectedSubmission.userId
      }

      // Add the review
      const reviewsRef = collection(db, 'hackathons', selectedHackathon, 'submissions', selectedSubmission.id, 'reviews')
      const reviewDoc = await addDoc(reviewsRef, reviewData)

      // Update submission status to 'Commented'
      const submissionRef = doc(db, 'hackathons', selectedHackathon, 'submissions', selectedSubmission.id)
      await updateDoc(submissionRef, {
        status: 'Commented',
        lastReviewAt: serverTimestamp()
      })

      // Mark as viewed for the reviewer (but not for the submission owner)
      if (auth.currentUser.uid !== selectedSubmission.userId) {
        await markReviewAsViewed(selectedSubmission.id, reviewDoc.id)
      }

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
          ? { ...sub, reviews: reviews, status: 'Commented' }
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

  const openReviewModal = async (submission) => {
    try {
      // Update status to 'In Review' when a reviewer opens the modal
      if (submission.status === 'Submitted') {
        const submissionRef = doc(db, 'hackathons', selectedHackathon, 'submissions', submission.id)
        await updateDoc(submissionRef, {
          status: 'In Review'
        })

        // Update local state
        setSubmissions(submissions.map(sub =>
          sub.id === submission.id
            ? { ...sub, status: 'In Review' }
            : sub
        ))
      }

      // Mark all reviews as viewed if the current user is the submission owner
      if (auth.currentUser.uid === submission.userId && submission.reviews?.length > 0) {
        const viewPromises = submission.reviews.map(async (review) => {
          const viewedRef = doc(db, 'users', auth.currentUser.uid, 'viewedReviews', review.id)
          await setDoc(viewedRef, {
            submissionId: submission.id,
            viewedAt: serverTimestamp()
          })
        })
        await Promise.all(viewPromises)
      }

      setSelectedSubmission({
        ...submission,
        status: submission.status === 'Submitted' ? 'In Review' : submission.status
      })
      setReviewModalOpen(true)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      const submissionRef = doc(db, 'hackathons', selectedHackathon, 'submissions', selectedSubmission.id)
      await updateDoc(submissionRef, {
        status: newStatus
      })

      // Update local state
      setSubmissions(submissions.map(sub =>
        sub.id === selectedSubmission.id
          ? { ...sub, status: newStatus }
          : sub
      ))
      setSelectedSubmission({ ...selectedSubmission, status: newStatus })

      toast.success(`Status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
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
              ? 'Submitted'
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
              <li key={submission.id} className="px-4 py-4">
                <div className="flex items-start justify-between">
                  {/* Left Column */}
                  <div className="flex flex-col space-y-3">
                    {/* Icons Row */}
                    <div className="flex items-center space-x-4">
                      {/* GitHub Icon */}
                      <a
                        href={submission.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800"
                        title="View GitHub Repository"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </a>

                      {/* Video Icon */}
                      {submission.videoUrl ? (
                        <a
                          href={submission.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                          title="Watch Demo Video"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-gray-400" title="No Demo Video Provided">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </span>
                      )}

                      {/* Deployed Site Icon */}
                      {submission.deployedUrl ? (
                        <a
                          href={submission.deployedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                          title="View Deployed Site"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-gray-400" title="No Deployed Site Available">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        </span>
                      )}
                    </div>

                    {/* User Name with Email Tooltip */}
                    <span
                      className="text-sm text-gray-700 cursor-help"
                      title={submission.userEmail}
                    >
                      {submission.firstName && submission.lastName
                        ? `${submission.firstName} ${submission.lastName}`
                        : submission.userEmail.split('@')[0]
                      }
                    </span>

                    {/* Add Review Button */}
                    <button
                      onClick={() => openReviewModal(submission)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-fit"
                    >
                      Add Review
                    </button>
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col items-end space-y-2">
                    {/* Status Badge */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${submission.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                      submission.status === 'In Review' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                      {submission.status}
                    </span>

                    {/* Submission Date */}
                    <p className="text-sm text-gray-500">
                      Submitted: {submission.createdAt ? formatDateTime(submission.createdAt) : 'Date unavailable'}
                    </p>

                    {/* Review Count */}
                    <button
                      onClick={() => {
                        setSelectedSubmission(submission)
                        setReviewModalOpen(true)
                      }}
                      className="text-gray-300 hover:text-indigo-600 bg-white hover:bg-gray-50 p-2 rounded-md transition-colors !bg-white"
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
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-[600px]">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Add Review
                      </h3>
                      <div className="relative">
                        <select
                          value={selectedSubmission.status}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className={`text-sm border-gray-300 rounded-md pr-8 pl-3 py-1 ${selectedSubmission.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                            selectedSubmission.status === 'In Review' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}
                          style={{ appearance: 'none' }}
                        >
                          <option value="Submitted" className="bg-yellow-100 text-yellow-800">Submitted</option>
                          <option value="In Review" className="bg-blue-100 text-blue-800">In Review</option>
                          <option value="Commented" className="bg-green-100 text-green-800">Commented</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <svg className="h-4 w-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="space-y-2">
                        <div className="mt-2">
                          <div className="flex items-center space-x-4">
                            {/* GitHub Icon */}
                            <a
                              href={selectedSubmission.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                              title="View GitHub Repository"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                              </svg>
                            </a>

                            {/* Video Icon */}
                            {selectedSubmission.videoUrl ? (
                              <a
                                href={selectedSubmission.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800"
                                title="Watch Demo Video"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-gray-400" title="No Demo Video Provided">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </span>
                            )}

                            {/* Deployed Site Icon */}
                            {selectedSubmission.deployedUrl ? (
                              <a
                                href={selectedSubmission.deployedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800"
                                title="View Deployed Site"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-gray-400" title="No Deployed Site Available">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-4">
                          <div>
                            <label htmlFor="score" className="block text-sm font-medium text-gray-700">Score (1-10)</label>
                            <input
                              type="number"
                              name="score"
                              id="score"
                              min="1"
                              max="10"
                              value={score}
                              onChange={(e) => setScore(parseInt(e.target.value))}
                              className="mt-1 block w-20 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="mt-4">
                            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Comment</label>
                            <div className="relative">
                              <textarea
                                id="comment"
                                name="comment"
                                rows="12"
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                              <div className="absolute bottom-2 left-2 flex space-x-2">
                                <button type="button" className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Add emoji">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button type="button" className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Add code snippet">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                  </svg>
                                </button>
                                <button type="button" className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Add image">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Previous Reviews Section */}
              <div className="px-4 pb-4">
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Previous Reviews</h4>
                  {selectedSubmission.reviews?.length > 0 ? (
                    <div className="space-y-4">
                      {selectedSubmission.reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {review.reviewerName || review.reviewerEmail}
                                </span>
                                <span className="text-sm font-medium text-indigo-600">
                                  Score: {review.score}/10
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
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

              {/* Modal Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAddReview}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
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
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
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
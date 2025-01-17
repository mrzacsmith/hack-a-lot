import { useState, useEffect } from 'react'
import { getAuth } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'

const Reviews = () => {
  const [submissions, setSubmissions] = useState([])
  const [currentUserRole, setCurrentUserRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [submissionToDelete, setSubmissionToDelete] = useState(null)
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

    const fetchSubmissions = async () => {
      try {
        const submissionsSnapshot = await getDocs(collection(db, 'submissions'))
        const submissionsList = await Promise.all(submissionsSnapshot.docs.map(async docSnapshot => {
          const data = docSnapshot.data()
          // Fetch the user's email for each submission
          const userDoc = await getDoc(doc(db, 'users', data.userId))

          // Fetch the hackathon data
          const hackathonDoc = await getDoc(doc(db, 'hackathons', data.hackathonId))

          return {
            id: docSnapshot.id,
            ...data,
            userEmail: userDoc.exists() ? userDoc.data().email : 'Unknown',
            hackathonTitle: hackathonDoc.exists() ? hackathonDoc.data().title : 'Unknown Event'
          }
        }))
        setSubmissions(submissionsList)
      } catch (error) {
        console.error('Error fetching submissions:', error)
        toast.error('Error loading submissions')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrentUserRole()
    fetchSubmissions()
  }, [auth.currentUser])

  const handleStatusChange = async (submissionId, newStatus) => {
    if (!currentUserRole || (currentUserRole !== 'admin' && currentUserRole !== 'reviewer')) {
      toast.error('You do not have permission to update submission status')
      return
    }

    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        status: newStatus,
        reviewedBy: auth.currentUser.uid,
        reviewedAt: new Date().toISOString()
      })

      // Update local state
      setSubmissions(submissions.map(submission =>
        submission.id === submissionId
          ? {
            ...submission,
            status: newStatus,
            reviewedBy: auth.currentUser.uid,
            reviewedAt: new Date().toISOString()
          }
          : submission
      ))

      toast.success('Submission status updated successfully')
    } catch (error) {
      console.error('Error updating submission status:', error)
      toast.error('Failed to update submission status')
    }
  }

  const handleDeleteSubmission = async (submissionId) => {
    if (!currentUserRole || (currentUserRole !== 'admin' && currentUserRole !== 'reviewer')) {
      toast.error('You do not have permission to delete submissions')
      return
    }

    try {
      await deleteDoc(doc(db, 'submissions', submissionId))

      // Update local state
      setSubmissions(submissions.filter(submission => submission.id !== submissionId))
      toast.success('Submission deleted successfully')
      setDeleteModalOpen(false)
      setSubmissionToDelete(null)
    } catch (error) {
      console.error('Error deleting submission:', error)
      toast.error('Failed to delete submission')
    }
  }

  const handleAddReview = async (submissionId, comment) => {
    if (!currentUserRole || (currentUserRole !== 'admin' && currentUserRole !== 'reviewer')) {
      toast.error('You do not have permission to add reviews')
      return
    }

    try {
      await addDoc(collection(db, 'reviews'), {
        submissionId,
        reviewerId: auth.currentUser.uid,
        comment,
        createdAt: new Date().toISOString()
      })

      toast.success('Review added successfully')
    } catch (error) {
      console.error('Error adding review:', error)
      toast.error('Failed to add review')
    }
  }

  const openDeleteModal = (submission) => {
    setSubmissionToDelete(submission)
    setDeleteModalOpen(true)
  }

  if (!currentUserRole || (currentUserRole !== 'admin' && currentUserRole !== 'reviewer')) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Reviews</h1>
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Reviews</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Reviews</h1>
      <div className="mt-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
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
                      <div className="text-xs text-gray-500">
                        Submitted on {new Date(submission.createdAt).toLocaleDateString()} at {new Date(submission.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div>{submission.userEmail}</div>
                      <div className="text-xs text-gray-500">
                        Event: {submission.hackathonTitle}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {submission.status || 'Pending'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-2">
                      <select
                        value={submission.status || 'pending'}
                        onChange={(e) => handleStatusChange(submission.id, e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="needs_revision">Needs Revision</option>
                      </select>
                      <button
                        onClick={() => openDeleteModal(submission)}
                        className="w-full px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete Submission
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && submissionToDelete && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setDeleteModalOpen(false)}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Delete Submission
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete the submission from {submissionToDelete.userEmail}? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={() => handleDeleteSubmission(submissionToDelete.id)}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => {
                    setDeleteModalOpen(false)
                    setSubmissionToDelete(null)
                  }}
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
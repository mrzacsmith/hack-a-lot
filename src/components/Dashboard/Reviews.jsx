import { useState, useEffect } from 'react'
import { getAuth } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'

const Reviews = () => {
  const [submissions, setSubmissions] = useState([])
  const [currentUserRole, setCurrentUserRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
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
        const submissionsList = await Promise.all(submissionsSnapshot.docs.map(async doc => {
          const data = doc.data()
          // Fetch the user's email for each submission
          const userDoc = await getDoc(doc(db, 'users', data.userId))
          return {
            id: doc.id,
            ...data,
            userEmail: userDoc.exists() ? userDoc.data().email : 'Unknown'
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
                    <a
                      href={submission.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {submission.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {submission.userEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {submission.status || 'Pending'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reviews 
import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, doc, getDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'

const Submissions = () => {
  const [url, setUrl] = useState('')
  const [submissions, setSubmissions] = useState([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    const auth = getAuth()
    if (auth.currentUser) {
      fetchUserRole(auth.currentUser.uid)
      fetchSubmissions()
    }
  }, [])

  const fetchUserRole = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role)
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const fetchSubmissions = async () => {
    try {
      const auth = getAuth()
      const userId = auth.currentUser.uid
      const userDoc = await getDoc(doc(db, 'users', userId))
      const role = userDoc.data()?.role

      const submissionsSnapshot = await getDocs(collection(db, 'submissions'))
      const submissionsList = submissionsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(submission => {
          // If admin or reviewer, show all submissions
          if (role === 'admin' || role === 'reviewer') return true
          // Otherwise, only show user's own submissions
          return submission.userId === userId
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      setSubmissions(submissionsList)
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
        // Basic URL validation
        const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+\/?)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/
        if (!urlPattern.test(url)) {
          throw new Error('Please enter a valid URL')
        }

        const auth = getAuth()
        const user = auth.currentUser

        await addDoc(collection(db, 'submissions'), {
          url,
          userId: user.uid,
          userEmail: user.email,
          createdAt: new Date().toISOString(),
          status: 'pending'
        })

        setUrl('')
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

  return (
    <div className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Submissions</h1>
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
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Project'}
                </button>
              </div>
            </form>
          </div>
        </div>

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
                      <a
                        href={submission.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {submission.url}
                      </a>
                      <p className="text-sm text-gray-500">
                        Submitted by {submission.userEmail} on{' '}
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${submission.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                        }`}
                    >
                      {submission.status}
                    </span>
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
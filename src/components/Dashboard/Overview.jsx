import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'

const Overview = () => {
  const [submissionCount, setSubmissionCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const submissionsSnapshot = await getDocs(collection(db, 'submissions'))
      const submissions = submissionsSnapshot.docs.map(doc => doc.data())

      setSubmissionCount(submissions.length)
      setPendingCount(submissions.filter(s => s.status === 'pending').length)
      setCompletedCount(submissions.filter(s => s.status === 'completed').length)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const stats = [
    { name: 'Total Submissions', stat: submissionCount.toString() },
    { name: 'Pending Reviews', stat: pendingCount.toString() },
    { name: 'Completed Reviews', stat: completedCount.toString() },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>

      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h2>
          <div className="mt-2 flex flex-col">
            <div className="min-w-full overflow-hidden overflow-x-auto align-middle shadow sm:rounded-lg">
              <div className="bg-white p-4">
                <p className="text-gray-500 text-sm">No recent activity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview 
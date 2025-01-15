import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import AdminPromotion from './AdminPromotion.jsx'

const Overview = () => {
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingReviews: 0,
    approvedSubmissions: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const submissionsSnapshot = await getDocs(collection(db, 'submissions'))
        const submissions = submissionsSnapshot.docs.map(doc => doc.data())

        setStats({
          totalSubmissions: submissions.length,
          pendingReviews: submissions.filter(s => !s.status || s.status === 'pending').length,
          approvedSubmissions: submissions.filter(s => s.status === 'approved').length
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Submissions</h3>
          <p className="mt-2 text-3xl font-semibold text-indigo-600">{stats.totalSubmissions}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Pending Reviews</h3>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">{stats.pendingReviews}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Approved Submissions</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">{stats.approvedSubmissions}</p>
        </div>
      </div>

      <div className="max-w-md">
        <AdminPromotion />
      </div>
    </div>
  )
}

export default Overview 
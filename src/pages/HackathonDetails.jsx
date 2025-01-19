import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { toast } from 'react-hot-toast'
import CountdownTimer from '../components/CountdownTimer'

function HackathonDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [hackathon, setHackathon] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchHackathon = async () => {
      if (!id) {
        setError('No hackathon ID provided')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching hackathon with ID:', id)
        const docRef = doc(db, 'hackathons', id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          console.log('Hackathon data:', data)
          // Handle both Timestamp and string formats
          const startDateTime = data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate)
          const endDateTime = data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate)
          const registrationDateTime = data.registrationDeadline?.toDate ? data.registrationDeadline.toDate() : new Date(data.registrationDeadline)

          setHackathon({
            id: docSnap.id,
            ...data,
            startDate: startDateTime || new Date(),
            endDate: endDateTime || new Date(),
            registrationDeadline: registrationDateTime || new Date()
          })
        } else {
          setError('Hackathon not found')
          toast.error('Hackathon not found')
        }
      } catch (error) {
        console.error('Error fetching hackathon:', error)
        setError(error.message)
        toast.error('Failed to load hackathon details')
      } finally {
        setLoading(false)
      }
    }

    fetchHackathon()
  }, [id])

  const formatDateTime = (date) => {
    if (!date) return 'Date not set'
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hackathon details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-600 mb-4">No hackathon found</div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Countdown Timer for active events */}
        {hackathon.status === 'active' && (
          <div className="bg-white shadow-md py-4 mb-8 rounded-lg">
            <div className="text-center text-gray-600 mb-2">Event in progress</div>
            <div className="text-sm text-center text-gray-500 mb-3">Time remaining:</div>
            <CountdownTimer endDate={hackathon.endDate} />
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {hackathon.imageUrl && (
            <div className="w-full h-64 sm:h-96 relative">
              <img
                src={hackathon.imageUrl}
                alt={hackathon.title}
                className="w-full h-full object-cover"
              />
              {hackathon.type === 'lightning' && (
                <div className="absolute top-4 right-4 flex items-center space-x-1 px-3 py-1.5 bg-indigo-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-indigo-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-indigo-700">
                    Lightning Round • {hackathon.duration} min
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{hackathon.title}</h1>
              </div>
              {hackathon.reward && (
                <div className="px-3 py-1 text-sm font-semibold bg-green-100 text-green-800 rounded-full">
                  Reward: {hackathon.reward}
                </div>
              )}
            </div>

            <div className="mt-2">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${hackathon.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                {hackathon.status.charAt(0).toUpperCase() + hackathon.status.slice(1)}
              </span>
            </div>

            {/* Description */}
            <div className="mt-6 prose prose-indigo max-w-none">
              <p className="text-gray-600 whitespace-pre-line">{hackathon.description}</p>
            </div>

            {/* Timeline */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">Timeline</h2>
              <div className="mt-4 space-y-4">
                <div className="flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-gray-600">
                    Registration Deadline: {formatDateTime(hackathon.registrationDeadline)}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">
                    Starts: {formatDateTime(hackathon.startDate)}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">
                    Ends: {formatDateTime(hackathon.endDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms of Participation */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Terms of Participation</h2>
                {hackathon.terms && (
                  <button
                    onClick={() => window.open(hackathon.terms, '_blank')}
                    className="text-indigo-600 hover:text-indigo-800 transition-colors"
                    title="View Terms"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </button>
                )}
              </div>
              {hackathon.terms && (
                <div className="mt-4 prose prose-indigo max-w-none">
                  <p className="text-gray-600 whitespace-pre-line">
                    {hackathon.terms}
                  </p>
                </div>
              )}
            </div>

            {/* Requirements */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">Submission Requirements</h2>
              <div className="mt-4 flex space-x-6">
                {hackathon.requireGithub && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    GitHub Repository
                  </div>
                )}
                {hackathon.requireVideo && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Video Demo
                  </div>
                )}
                {hackathon.requireDeployed && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Deployed Project
                  </div>
                )}
              </div>
            </div>

            {/* Registration/Status Section */}
            <div className="mt-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                {hackathon.status === 'active' ? (
                  <div className="text-center text-gray-600">
                    Event in progress
                  </div>
                ) : hackathon.status === 'upcoming' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Available spots:</span>
                      <span className="font-medium">{hackathon.maxParticipants - (hackathon.participants?.length || 0)} of {hackathon.maxParticipants}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/hackathons/${hackathon.id}/register`)}
                      className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Register Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HackathonDetails 
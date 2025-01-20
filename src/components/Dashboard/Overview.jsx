import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, doc, updateDoc, arrayRemove } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const CountdownTimer = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  function calculateTimeLeft() {
    const difference = new Date(endDate) - new Date()
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  return (
    <div className="flex justify-center space-x-4 text-sm mt-4">
      <div className="text-center">
        <div className="font-mono bg-gray-100 rounded px-2 py-1">{timeLeft.days}</div>
        <div className="text-gray-500 text-xs mt-1">Days</div>
      </div>
      <div className="text-center">
        <div className="font-mono bg-gray-100 rounded px-2 py-1">{timeLeft.hours}</div>
        <div className="text-gray-500 text-xs mt-1">Hours</div>
      </div>
      <div className="text-center">
        <div className="font-mono bg-gray-100 rounded px-2 py-1">{timeLeft.minutes}</div>
        <div className="text-gray-500 text-xs mt-1">Mins</div>
      </div>
      <div className="text-center">
        <div className="font-mono bg-gray-100 rounded px-2 py-1">{timeLeft.seconds}</div>
        <div className="text-gray-500 text-xs mt-1">Secs</div>
      </div>
    </div>
  )
}

const Overview = () => {
  const [registeredHackathons, setRegisteredHackathons] = useState([])
  const [loading, setLoading] = useState(true)
  const auth = getAuth()

  useEffect(() => {
    const fetchRegisteredHackathons = async () => {
      try {
        const hackathonsQuery = query(
          collection(db, 'hackathons'),
          where('participants', 'array-contains', auth.currentUser.uid)
        )
        const hackathonsSnapshot = await getDocs(hackathonsQuery)
        const hackathonsList = hackathonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate.toDate(),
          endDate: doc.data().endDate.toDate(),
          registrationDeadline: doc.data().registrationDeadline.toDate()
        }))
        setRegisteredHackathons(hackathonsList)
      } catch (error) {
        console.error('Error fetching registered hackathons:', error)
        toast.error('Failed to load registered hackathons')
      } finally {
        setLoading(false)
      }
    }

    if (auth.currentUser) {
      fetchRegisteredHackathons()
    }
  }, [auth.currentUser])

  const handleUnregister = async (hackathonId) => {
    try {
      const hackathonRef = doc(db, 'hackathons', hackathonId)
      await updateDoc(hackathonRef, {
        participants: arrayRemove(auth.currentUser.uid)
      })

      // Update local state
      setRegisteredHackathons(prev => prev.filter(h => h.id !== hackathonId))
      toast.success('Successfully unregistered from hackathon')
    } catch (error) {
      console.error('Error unregistering from hackathon:', error)
      toast.error('Failed to unregister from hackathon')
    }
  }

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Overview</h1>

      <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Registered Hackathons</h2>
      {loading ? (
        <div>Loading...</div>
      ) : registeredHackathons.length === 0 ? (
        <div className="text-gray-500">You haven't registered for any hackathons yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registeredHackathons.map((hackathon) => (
            <div key={hackathon.id} className="relative">
              <Link to={`/hackathons/${hackathon.id}`} className="block">
                <div
                  className={`rounded-lg shadow-lg overflow-hidden h-[32rem] flex flex-col ${hackathon.status === 'active'
                    ? 'bg-green-50 border border-green-300'
                    : hackathon.status === 'upcoming'
                      ? 'bg-yellow-50 border border-yellow-300'
                      : hackathon.status === 'completed'
                        ? 'bg-gray-50 border border-gray-300'
                        : 'bg-white'
                    }`}
                >
                  {hackathon.imageUrl ? (
                    <div className="h-48 w-full flex-shrink-0">
                      <img
                        src={hackathon.imageUrl}
                        alt={hackathon.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{hackathon.title}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${hackathon.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : hackathon.status === 'upcoming'
                          ? 'bg-yellow-100 text-yellow-800'
                          : hackathon.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {hackathon.status.charAt(0).toUpperCase() + hackathon.status.slice(1)}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Starts:</span> {formatDateTime(hackathon.startDate)}</p>
                      <p><span className="font-medium">Ends:</span> {formatDateTime(hackathon.endDate)}</p>
                      <p><span className="font-medium">Registration Deadline:</span> {formatDateTime(hackathon.registrationDeadline)}</p>
                      {hackathon.status === 'active' && (
                        <>
                          <p className="font-medium text-center mt-4">Time Remaining:</p>
                          <CountdownTimer endDate={hackathon.endDate} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
              {/* Unregister button outside the Link to prevent event bubbling */}
              <div className="absolute bottom-6 right-6">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleUnregister(hackathon.id);
                  }}
                  disabled={hackathon.status === 'completed'}
                  className={`relative p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${hackathon.status === 'completed'
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-red-600 hover:bg-red-100 focus:ring-red-500'
                    } bg-white group`}
                  title={hackathon.status === 'completed' ? 'Cannot unregister from completed hackathon' : 'Unregister from hackathon'}
                >
                  <span className="sr-only">
                    {hackathon.status === 'completed' ? 'Completed' : 'Unregister'}
                  </span>
                  {/* Tooltip */}
                  <span className="absolute bottom-full right-0 mb-2 w-32 rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {hackathon.status === 'completed' ? 'Completed' : 'Unregister'}
                  </span>
                  {/* Unregister Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Overview 
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { db } from '../firebase/config'

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
    <div className="flex justify-center space-x-4 text-sm">
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

const LandingPage = () => {
  const [hackathons, setHackathons] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const auth = getAuth()
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })

    return () => unsubscribeAuth()
  }, [])

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }).format(date)
  }

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }).format(date)
  }

  const formatDateTime = (date) => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone: timeZone
    }).format(date)
  }

  useEffect(() => {
    setLoading(true)
    setError(null)

    const q = query(
      collection(db, 'hackathons'),
      where('status', 'in', ['upcoming', 'active']),
      orderBy('startDate', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hackathonsList = snapshot.docs.map(doc => {
        const data = doc.data()
        const startDateTime = data.startDate?.toDate()
        const endDateTime = data.endDate?.toDate()
        const registrationDateTime = data.registrationDeadline?.toDate()

        return {
          id: doc.id,
          ...data,
          startDate: startDateTime,
          endDate: endDateTime,
          registrationDeadline: registrationDateTime,
          startTime: startDateTime ? formatTime(startDateTime) : '',
          endTime: endDateTime ? formatTime(endDateTime) : ''
        }
      })
      setHackathons(hackathonsList)
      setLoading(false)
    }, (error) => {
      console.error('Error listening to hackathons:', error)
      setError('Failed to load hackathons. Please try again later.')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleRegisterClick = (hackathonId) => {
    if (user) {
      // User is authenticated, go directly to hackathon registration
      navigate(`/hackathons/${hackathonId}/register`)
    } else {
      // User is not authenticated, go to register page with redirect
      navigate('/register', {
        state: {
          redirectTo: `/hackathons/${hackathonId}/register`,
          message: 'Please create an account to register for the hackathon.'
        }
      })
    }
  }

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      {!user && (
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-gray-50 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Streamline Your</span>
                    <span className="block text-indigo-600">Hackathon Reviews</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    A powerful platform for managing hackathon submissions, reviews, and feedback. Perfect for organizers,
                    participants, and reviewers.
                  </p>
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link
                        to="/register"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                      >
                        Get Started
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link
                        to="/login"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10"
                      >
                        Sign In
                      </Link>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      )}

      {/* Hackathon Events Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Upcoming & Active Hackathons</h2>
            <p className="mt-4 text-xl text-gray-500">Join our upcoming events and showcase your skills</p>
          </div>

          {loading ? (
            <div className="mt-12 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="mt-12 text-center text-red-600">
              {error}
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {hackathons.length > 0 ? (
                hackathons.map((hackathon) => (
                  <div
                    key={hackathon.id}
                    className={`flex flex-col rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 relative ${hackathon.type === 'lightning'
                      ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-indigo-500'
                      : 'bg-white'
                      } ${hackathon.status === 'active' ? 'ring-2 ring-green-500' : ''}`}
                  >
                    {hackathon.type === 'lightning' && (
                      <div className="absolute top-4 right-4 flex items-center space-x-1 px-2 py-1 bg-indigo-100 rounded-full z-10">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4 text-indigo-600"
                        >
                          <path
                            fillRule="evenodd"
                            d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs font-semibold text-indigo-700">Lightning Round</span>
                      </div>
                    )}
                    {hackathon.imageUrl ? (
                      <div className="h-48 w-full overflow-hidden">
                        <img
                          src={hackathon.imageUrl}
                          alt={hackathon.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-xl font-semibold text-gray-900">{hackathon.title}</h3>
                            {hackathon.type === 'lightning' && (
                              <div className="flex items-center space-x-1 text-indigo-600">
                                <span className="text-sm font-semibold">
                                  {hackathon.duration} min
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${hackathon.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {hackathon.status.charAt(0).toUpperCase() + hackathon.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-gray-500 text-sm line-clamp-2">{hackathon.description}</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Starts: {formatDateTime(hackathon.startDate)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Ends: {formatDateTime(hackathon.endDate)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>Max Participants: {hackathon.maxParticipants}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>Register by: {formatDateTime(hackathon.registrationDeadline)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50">
                      {hackathon.status === 'active' ? (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-500 text-center">Event in progress</div>
                          <div className="text-xs text-gray-500 text-center">Time remaining:</div>
                          <CountdownTimer endDate={hackathon.endDate} />
                        </div>
                      ) : hackathon.status === 'upcoming' && (
                        <button
                          onClick={() => handleRegisterClick(hackathon.id)}
                          className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Register Now
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500">
                  No upcoming or active hackathons at the moment.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage hackathons
            </p>
          </div>
          {/* ... rest of the features section ... */}
        </div>
      </div>
    </div>
  )
}

export default LandingPage 
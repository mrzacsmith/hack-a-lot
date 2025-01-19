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
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-400 to-indigo-900">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 lg:grid lg:grid-cols-2 lg:gap-8">
              {/* Text Content */}
              <div className="relative pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                  <div className="sm:text-center lg:text-left">
                    <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                      <span className="block">Discover Your</span>
                      <span className="block text-indigo-200">Sisu</span>
                    </h1>
                    <p className="mt-3 text-base text-gray-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                      A platform designed for creators, dreamers, and problem-solvers to innovate with purpose and tenacity. Join us to transform barriers into breakthroughs and ideas into extraordinary solutions.
                    </p>
                    <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                      <div className="rounded-md shadow">
                        <Link
                          to="/register"
                          className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                        >
                          Start Building
                        </Link>
                      </div>
                      <div className="mt-3 sm:mt-0 sm:ml-3">
                        <Link
                          to="/login"
                          className="w-full flex items-center justify-center px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-indigo-800 md:py-4 md:text-lg md:px-10"
                        >
                          Sign In
                        </Link>
                      </div>
                    </div>
                  </div>
                </main>
              </div>

              {/* Image Content */}
              <div className="relative lg:inset-y-0 lg:right-0 lg:h-full min-h-[400px] lg:min-h-0">
                <div className="relative h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  {/* Decorative circles */}
                  <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-2xl" />

                  {/* Placeholder icon and text */}
                  <div className="relative text-center p-8">
                    <svg
                      className="mx-auto h-24 w-24 text-white/80"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z"
                      />
                    </svg>
                    <span className="mt-4 block text-white/60 text-sm">Hero Image Placeholder</span>
                  </div>

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-l from-indigo-900/50 to-transparent mix-blend-overlay" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">The Spirit of Sisu</h2>
            <p className="mt-4 text-xl text-gray-500">Grit, courage, and unwavering determination</p>
          </div>
          <div className="mt-12 aspect-video w-full max-w-4xl mx-auto bg-gray-100 rounded-lg shadow-lg">
            {/* Video embed placeholder - we'll need the YouTube URL */}
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Video Coming Soon
            </div>
          </div>
        </div>
      </div>

      {/* Hackathon Events Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Build Something Extraordinary</h2>
            <p className="mt-4 text-xl text-gray-500">Join upcoming hackathons and showcase your innovation</p>
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
                    onClick={() => navigate(`/hackathons/${hackathon.id}`)}
                    className={`flex flex-col rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 relative cursor-pointer ${hackathon.type === 'lightning'
                      ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-indigo-500'
                      : 'bg-white'
                      } ${hackathon.status === 'active' ? 'ring-2 ring-green-500' : ''}`}
                  >
                    {/* Image Section */}
                    <div className="aspect-video w-full overflow-hidden">
                      {hackathon.imageUrl ? (
                        <img
                          src={hackathon.imageUrl}
                          alt={hackathon.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Lightning Round Badge */}
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
                        <span className="text-xs font-semibold text-indigo-700">{hackathon.duration} min</span>
                      </div>
                    )}

                    <div className="flex-1 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{hackathon.title}</h3>
                          <span className={`mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full ${hackathon.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {hackathon.status.charAt(0).toUpperCase() + hackathon.status.slice(1)}
                          </span>
                        </div>
                        {hackathon.reward && (
                          <div className="group relative">
                            <span className="text-green-600 font-semibold cursor-help">$</span>
                            {/* Tooltip */}
                            <div className="absolute right-0 w-auto p-2 min-w-max rounded-md shadow-md
                              text-white bg-gray-900 text-xs
                              transition-all duration-100 scale-0 origin-right group-hover:scale-100
                              z-50">
                              Reward: {hackathon.reward}
                            </div>
                          </div>
                        )}
                      </div>

                      <p className="mt-3 text-gray-500 text-sm line-clamp-3 hover:text-gray-700">
                        {hackathon.description}
                      </p>

                      <div className="mt-4 space-y-2">
                        {/* Registration Deadline - Moved to top */}
                        <div className="flex items-center text-sm text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>Register by: {formatDateTime(hackathon.registrationDeadline)}</span>
                        </div>

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

      {/* Find Your Sisu Section */}
      <div className="py-16 bg-gradient-to-br from-indigo-400 to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Find Your Sisu</h2>
            <p className="mt-4 text-xl text-gray-100 max-w-3xl mx-auto">
              Through our hackathons, you'll gain more than just technical know-how. You'll sharpen your skills, expand your knowledge, and create demonstrable proof of your dedication to innovation.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Start Building
              </Link>
              <Link
                to="/hackathons"
                className="inline-flex items-center px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-indigo-800 md:py-4 md:text-lg md:px-10"
              >
                Browse Hackathons
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Why Build with Sisu</h2>
            <p className="mt-4 text-xl text-gray-500">Everything you need to bring your ideas to life</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-indigo-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Collaborative Innovation</h3>
              <p className="mt-2 text-gray-500">Connect with like-minded innovators and build together in a supportive environment.</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-indigo-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Skill Development</h3>
              <p className="mt-2 text-gray-500">Sharpen your technical skills and learn from real-world project experiences.</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-indigo-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Portfolio Building</h3>
              <p className="mt-2 text-gray-500">Create demonstrable proof of your skills and innovation through completed projects.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Sisu Builder</h3>
              <p className="text-gray-400 text-sm">Transforming ideas into extraordinary solutions through the power of Sisu.</p>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/hackathons" className="text-gray-400 hover:text-white text-sm">Browse Hackathons</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-white text-sm">Get Started</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white text-sm">About Sisu</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-sm text-center">&copy; {new Date().getFullYear()} Sisu Builder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage 
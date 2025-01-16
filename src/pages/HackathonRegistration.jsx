import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '../firebase/config'
import { toast } from 'react-hot-toast'

const HackathonRegistration = () => {
  const { hackathonId } = useParams()
  const navigate = useNavigate()
  const [hackathon, setHackathon] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const auth = getAuth()

  useEffect(() => {
    const fetchHackathon = async () => {
      try {
        const hackathonDoc = await getDoc(doc(db, 'hackathons', hackathonId))
        if (hackathonDoc.exists()) {
          const data = hackathonDoc.data()
          setHackathon({
            id: hackathonDoc.id,
            ...data,
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate(),
            registrationDeadline: data.registrationDeadline.toDate()
          })
        } else {
          toast.error('Hackathon not found')
          navigate('/dashboard')
        }
      } catch (error) {
        console.error('Error fetching hackathon:', error)
        toast.error('Failed to load hackathon details')
      } finally {
        setLoading(false)
      }
    }

    if (!auth.currentUser) {
      navigate('/login', {
        state: {
          redirectTo: `/hackathons/${hackathonId}/register`,
          message: 'Please log in to register for the hackathon.'
        }
      })
      return
    }

    fetchHackathon()
  }, [hackathonId, navigate, auth.currentUser])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const now = new Date()
      if (now > hackathon.registrationDeadline) {
        toast.error('Registration deadline has passed')
        return
      }

      const hackathonRef = doc(db, 'hackathons', hackathonId)
      const currentHackathon = await getDoc(hackathonRef)
      const participants = currentHackathon.data()?.participants || []

      if (participants.includes(auth.currentUser.uid)) {
        toast.error('You are already registered for this hackathon')
        return
      }

      if (participants.length >= hackathon.maxParticipants) {
        toast.error('This hackathon has reached maximum capacity')
        return
      }

      await updateDoc(hackathonRef, {
        participants: arrayUnion(auth.currentUser.uid)
      })

      toast.success('Successfully registered for the hackathon!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Error registering for hackathon:', error)
      toast.error('Failed to register for hackathon')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{hackathon.title}</h2>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${hackathon.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
              {hackathon.status.charAt(0).toUpperCase() + hackathon.status.slice(1)}
            </span>
          </div>

          <div className="mt-4">
            <p className="text-gray-600">{hackathon.description}</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {hackathon.startDate.toLocaleDateString()} at {hackathon.startDate.toLocaleTimeString()}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {hackathon.endDate.toLocaleDateString()} at {hackathon.endDate.toLocaleTimeString()}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Registration Deadline</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {hackathon.registrationDeadline.toLocaleDateString()} at {hackathon.registrationDeadline.toLocaleTimeString()}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Available Spots</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {hackathon.maxParticipants - (hackathon.participants?.length || 0)} of {hackathon.maxParticipants}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                By registering, you agree to participate in this hackathon and follow its rules and guidelines.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className={`ml-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {submitting ? 'Registering...' : 'Confirm Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default HackathonRegistration 
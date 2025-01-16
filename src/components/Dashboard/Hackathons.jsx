import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { toast } from 'react-hot-toast'

const Hackathons = () => {
  const [hackathons, setHackathons] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [newHackathon, setNewHackathon] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    maxParticipants: '',
    status: 'upcoming'
  })

  useEffect(() => {
    fetchHackathons()
  }, [])

  const fetchHackathons = async () => {
    try {
      const hackathonsSnapshot = await getDocs(collection(db, 'hackathons'))
      const hackathonsList = hackathonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate().toISOString().split('T')[0] || '',
        endDate: doc.data().endDate?.toDate().toISOString().split('T')[0] || '',
        registrationDeadline: doc.data().registrationDeadline?.toDate().toISOString().split('T')[0] || ''
      }))
      setHackathons(hackathonsList)
    } catch (error) {
      console.error('Error fetching hackathons:', error)
      toast.error('Failed to load hackathons')
    }
  }

  const handleCreateHackathon = async (e) => {
    e.preventDefault()
    try {
      const hackathonData = {
        ...newHackathon,
        startDate: Timestamp.fromDate(new Date(newHackathon.startDate)),
        endDate: Timestamp.fromDate(new Date(newHackathon.endDate)),
        registrationDeadline: Timestamp.fromDate(new Date(newHackathon.registrationDeadline)),
        maxParticipants: parseInt(newHackathon.maxParticipants),
        createdAt: Timestamp.now(),
        participants: []
      }

      await addDoc(collection(db, 'hackathons'), hackathonData)
      toast.success('Hackathon created successfully')
      setIsCreating(false)
      setNewHackathon({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        maxParticipants: '',
        status: 'upcoming'
      })
      fetchHackathons()
    } catch (error) {
      console.error('Error creating hackathon:', error)
      toast.error('Failed to create hackathon')
    }
  }

  const handleUpdateStatus = async (hackathonId, newStatus) => {
    try {
      await updateDoc(doc(db, 'hackathons', hackathonId), {
        status: newStatus
      })
      toast.success('Hackathon status updated')
      fetchHackathons()
    } catch (error) {
      console.error('Error updating hackathon status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleDeleteHackathon = async (hackathonId) => {
    if (window.confirm('Are you sure you want to delete this hackathon?')) {
      try {
        await deleteDoc(doc(db, 'hackathons', hackathonId))
        toast.success('Hackathon deleted')
        fetchHackathons()
      } catch (error) {
        console.error('Error deleting hackathon:', error)
        toast.error('Failed to delete hackathon')
      }
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hackathons</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Create Hackathon
        </button>
      </div>

      {isCreating && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Create New Hackathon</h2>
          <form onSubmit={handleCreateHackathon} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                required
                value={newHackathon.title}
                onChange={(e) => setNewHackathon({ ...newHackathon, title: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900 h-10 px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                required
                value={newHackathon.description}
                onChange={(e) => setNewHackathon({ ...newHackathon, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900 px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  required
                  value={newHackathon.startDate}
                  onChange={(e) => setNewHackathon({ ...newHackathon, startDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900 h-10 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  required
                  value={newHackathon.endDate}
                  onChange={(e) => setNewHackathon({ ...newHackathon, endDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900 h-10 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Deadline</label>
                <input
                  type="date"
                  required
                  value={newHackathon.registrationDeadline}
                  onChange={(e) => setNewHackathon({ ...newHackathon, registrationDeadline: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900 h-10 px-3"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Participants</label>
              <input
                type="number"
                required
                min="1"
                value={newHackathon.maxParticipants}
                onChange={(e) => setNewHackathon({ ...newHackathon, maxParticipants: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900 h-10 px-3"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {hackathons.map((hackathon) => (
            <li key={hackathon.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{hackathon.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{hackathon.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Start: {new Date(hackathon.startDate).toLocaleDateString()}</p>
                    <p>End: {new Date(hackathon.endDate).toLocaleDateString()}</p>
                    <p>Registration Deadline: {new Date(hackathon.registrationDeadline).toLocaleDateString()}</p>
                    <p>Max Participants: {hackathon.maxParticipants}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={hackathon.status}
                    onChange={(e) => handleUpdateStatus(hackathon.id, e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => handleDeleteHackathon(hackathon.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Hackathons 
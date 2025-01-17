import { useState, useEffect, useRef } from 'react'
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db } from '../../firebase/config'
import { toast } from 'react-hot-toast'

const Hackathons = () => {
  const [hackathons, setHackathons] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const [editingHackathon, setEditingHackathon] = useState(null)
  const [newHackathon, setNewHackathon] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '17:00',
    registrationDeadline: '',
    maxParticipants: '',
    status: 'upcoming',
    imageUrl: '',
    type: 'regular',
    duration: 60 // Default duration in minutes
  })

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  useEffect(() => {
    // Set up realtime listener
    const unsubscribe = onSnapshot(collection(db, 'hackathons'), (snapshot) => {
      const hackathonsList = snapshot.docs.map(doc => {
        const data = doc.data()
        const startDateTime = data.startDate?.toDate()
        const endDateTime = data.endDate?.toDate()
        const registrationDateTime = data.registrationDeadline?.toDate()

        return {
          id: doc.id,
          ...data,
          startDate: startDateTime?.toISOString().split('T')[0] || '',
          startTime: startDateTime ? `${startDateTime.getHours().toString().padStart(2, '0')}:${startDateTime.getMinutes().toString().padStart(2, '0')}` : '09:00',
          endDate: endDateTime?.toISOString().split('T')[0] || '',
          endTime: endDateTime ? `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}` : '17:00',
          registrationDeadline: registrationDateTime?.toISOString().split('T')[0] || ''
        }
      })
      setHackathons(hackathonsList)
    }, (error) => {
      console.error('Error listening to hackathons:', error)
      toast.error('Failed to listen to hackathon updates')
    })

    return () => unsubscribe()
  }, [])

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file)
    }
  }

  const handleImageFile = (file) => {
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleCreateHackathon = async (e) => {
    e.preventDefault()
    try {
      let imageUrl = ''
      if (imageFile) {
        const storage = getStorage()
        const imageRef = ref(storage, `hackathons/${Date.now()}_${imageFile.name}`)
        await uploadBytes(imageRef, imageFile)
        imageUrl = await getDownloadURL(imageRef)
      }

      // Create Date objects with the correct time
      const [startHours, startMinutes] = newHackathon.startTime.split(':').map(Number)
      const [endHours, endMinutes] = newHackathon.endTime.split(':').map(Number)

      const startDateTime = new Date(newHackathon.startDate)
      startDateTime.setHours(startHours, startMinutes, 0)

      const endDateTime = new Date(newHackathon.endDate)
      endDateTime.setHours(endHours, endMinutes, 0)

      const registrationDateTime = new Date(newHackathon.registrationDeadline)
      registrationDateTime.setHours(23, 59, 59) // Set registration deadline to end of day

      // Determine initial status based on dates
      const now = new Date()
      const status = startDateTime <= now && now <= endDateTime ? 'active' : 'upcoming'

      const hackathonData = {
        ...newHackathon,
        startDate: Timestamp.fromDate(startDateTime),
        endDate: Timestamp.fromDate(endDateTime),
        registrationDeadline: Timestamp.fromDate(registrationDateTime),
        maxParticipants: parseInt(newHackathon.maxParticipants),
        createdAt: Timestamp.now(),
        participants: [],
        imageUrl,
        status,
        type: newHackathon.type,
        duration: newHackathon.type === 'lightning' ? newHackathon.duration : null
      }

      await addDoc(collection(db, 'hackathons'), hackathonData)
      toast.success('Hackathon created successfully')
      setIsCreating(false)
      setNewHackathon({
        title: '',
        description: '',
        startDate: '',
        startTime: '09:00',
        endDate: '',
        endTime: '17:00',
        registrationDeadline: '',
        maxParticipants: '',
        status: 'upcoming',
        type: 'regular',
        duration: 60
      })
      setImageFile(null)
      setImagePreview(null)
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
      } catch (error) {
        console.error('Error deleting hackathon:', error)
        toast.error('Failed to delete hackathon')
      }
    }
  }

  const handleEditClick = (hackathon) => {
    setEditingHackathon({
      ...hackathon,
      startDate: hackathon.startDate,
      startTime: hackathon.startTime,
      endDate: hackathon.endDate,
      endTime: hackathon.endTime,
      registrationDeadline: hackathon.registrationDeadline
    })
    setImagePreview(hackathon.imageUrl)
    setIsEditing(true)
  }

  const handleUpdateHackathon = async (e) => {
    e.preventDefault()
    try {
      let imageUrl = editingHackathon.imageUrl
      if (imageFile) {
        const storage = getStorage()
        const imageRef = ref(storage, `hackathons/${Date.now()}_${imageFile.name}`)
        await uploadBytes(imageRef, imageFile)
        imageUrl = await getDownloadURL(imageRef)
      }

      // Create Date objects with the correct time
      const [startHours, startMinutes] = editingHackathon.startTime.split(':').map(Number)
      const [endHours, endMinutes] = editingHackathon.endTime.split(':').map(Number)

      const startDateTime = new Date(editingHackathon.startDate)
      startDateTime.setHours(startHours, startMinutes, 0)

      const endDateTime = new Date(editingHackathon.endDate)
      endDateTime.setHours(endHours, endMinutes, 0)

      const registrationDateTime = new Date(editingHackathon.registrationDeadline)
      registrationDateTime.setHours(23, 59, 59) // Set registration deadline to end of day

      // Determine status based on dates if not manually set
      const now = new Date()
      let status = editingHackathon.status
      if (status === 'upcoming' || status === 'active') {
        status = startDateTime <= now && now <= endDateTime ? 'active' : 'upcoming'
      }

      const hackathonData = {
        ...editingHackathon,
        startDate: Timestamp.fromDate(startDateTime),
        endDate: Timestamp.fromDate(endDateTime),
        registrationDeadline: Timestamp.fromDate(registrationDateTime),
        maxParticipants: parseInt(editingHackathon.maxParticipants),
        imageUrl,
        status // Set the computed status
      }

      // Remove only the id field
      delete hackathonData.id

      await updateDoc(doc(db, 'hackathons', editingHackathon.id), hackathonData)
      toast.success('Hackathon updated successfully')
      setIsEditing(false)
      setEditingHackathon(null)
      setImageFile(null)
      setImagePreview(null)
    } catch (error) {
      console.error('Error updating hackathon:', error)
      toast.error('Failed to update hackathon')
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
                className="mt-1 block w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Event Image</label>
              <div
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                  }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-40 w-auto object-contain mb-4"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Change image
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                          <span>Upload a file</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                required
                value={newHackathon.description}
                onChange={(e) => setNewHackathon({ ...newHackathon, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Hackathon Type</label>
                <select
                  required
                  value={newHackathon.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setNewHackathon(prev => {
                      const updated = { ...prev, type: newType };
                      if (newType === 'lightning') {
                        // For Lightning Round, calculate end time based on duration
                        const startDateTime = new Date(`${updated.startDate}T${updated.startTime}`);
                        if (startDateTime.toString() !== 'Invalid Date') {
                          const endDateTime = new Date(startDateTime.getTime() + (updated.duration * 60 * 1000));
                          updated.endDate = endDateTime.toISOString().split('T')[0];
                          updated.endTime = endDateTime.toTimeString().slice(0, 5);
                        }
                      }
                      return updated;
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="regular">Regular</option>
                  <option value="lightning">Lightning Round</option>
                </select>
              </div>

              {newHackathon.type === 'lightning' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="range"
                      min="15"
                      max="360"
                      step="15"
                      value={newHackathon.duration}
                      onChange={(e) => {
                        const newDuration = parseInt(e.target.value);
                        setNewHackathon(prev => {
                          const updated = { ...prev, duration: newDuration };
                          if (updated.startDate && updated.startTime) {
                            const startDateTime = new Date(`${updated.startDate}T${updated.startTime}`);
                            const endDateTime = new Date(startDateTime.getTime() + (newDuration * 60 * 1000));
                            updated.endDate = endDateTime.toISOString().split('T')[0];
                            updated.endTime = endDateTime.toTimeString().slice(0, 5);
                          }
                          return updated;
                        });
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 w-20">{newHackathon.duration} min</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 flex justify-between">
                    <span>15 min</span>
                    <span>6 hours</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  required
                  value={newHackathon.startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setNewHackathon(prev => {
                      const updated = { ...prev, startDate: newStartDate };
                      if (updated.type === 'lightning' && newStartDate && updated.startTime) {
                        const startDateTime = new Date(`${newStartDate}T${updated.startTime}`);
                        const endDateTime = new Date(startDateTime.getTime() + (updated.duration * 60 * 1000));
                        updated.endDate = endDateTime.toISOString().split('T')[0];
                        updated.endTime = endDateTime.toTimeString().slice(0, 5);
                      }
                      return updated;
                    });
                  }}
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="time"
                  required
                  value={newHackathon.startTime}
                  onChange={(e) => {
                    const newStartTime = e.target.value;
                    setNewHackathon(prev => {
                      const updated = { ...prev, startTime: newStartTime };
                      if (updated.type === 'lightning' && updated.startDate) {
                        const startDateTime = new Date(`${updated.startDate}T${newStartTime}`);
                        const endDateTime = new Date(startDateTime.getTime() + (updated.duration * 60 * 1000));
                        updated.endDate = endDateTime.toISOString().split('T')[0];
                        updated.endTime = endDateTime.toTimeString().slice(0, 5);
                      }
                      return updated;
                    });
                  }}
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  required
                  value={newHackathon.endDate}
                  onChange={(e) => setNewHackathon({ ...newHackathon, endDate: e.target.value })}
                  className="mt-1 block w-full"
                  disabled={newHackathon.type === 'lightning'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="time"
                  required
                  value={newHackathon.endTime}
                  onChange={(e) => setNewHackathon({ ...newHackathon, endTime: e.target.value })}
                  className="mt-1 block w-full"
                  disabled={newHackathon.type === 'lightning'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Registration Deadline</label>
              <input
                type="date"
                required
                value={newHackathon.registrationDeadline}
                onChange={(e) => setNewHackathon({ ...newHackathon, registrationDeadline: e.target.value })}
                className="mt-1 block w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Max Participants</label>
              <input
                type="number"
                required
                min="1"
                value={newHackathon.maxParticipants}
                onChange={(e) => setNewHackathon({ ...newHackathon, maxParticipants: e.target.value })}
                className="mt-1 block w-full"
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
            <li
              key={hackathon.id}
              className={`px-6 py-4 ${hackathon.status === 'upcoming' ? 'bg-yellow-50' :
                hackathon.status === 'active' ? 'bg-green-50' :
                  hackathon.status === 'completed' ? 'bg-gray-50' :
                    hackathon.status === 'cancelled' ? 'bg-red-50' :
                      'bg-white'
                } hover:bg-opacity-80 transition-colors duration-200`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 h-24 w-24">
                    {hackathon.imageUrl ? (
                      <img
                        src={hackathon.imageUrl}
                        alt={hackathon.title}
                        className="h-24 w-24 object-cover rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{hackathon.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{hackathon.description}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>Start: {formatDate(hackathon.startDate)} at {hackathon.startTime}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>End: {formatDate(hackathon.endDate)} at {hackathon.endTime}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>Registration Deadline: {formatDate(hackathon.registrationDeadline)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p>Max Participants: {hackathon.maxParticipants}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-4">
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
                      onClick={() => handleEditClick(hackathon)}
                      className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-gray-100"
                      title="Edit Hackathon"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteHackathon(hackathon.id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-gray-100"
                      title="Delete Hackathon"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isEditing && editingHackathon && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Hackathon</h2>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditingHackathon(null)
                  setImageFile(null)
                  setImagePreview(null)
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateHackathon} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  required
                  value={editingHackathon.title}
                  onChange={(e) => setEditingHackathon({ ...editingHackathon, title: e.target.value })}
                  className="mt-1 block w-full"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Image</label>
                <div
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                    }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-40 w-auto object-contain mb-4"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Change image
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                            <span>Upload a file</span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  required
                  value={editingHackathon.description}
                  onChange={(e) => setEditingHackathon({ ...editingHackathon, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editingHackathon.startDate}
                    onChange={(e) => setEditingHackathon({ ...editingHackathon, startDate: e.target.value })}
                    className="mt-1 block w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    required
                    value={editingHackathon.startTime}
                    onChange={(e) => setEditingHackathon({ ...editingHackathon, startTime: e.target.value })}
                    className="mt-1 block w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    required
                    value={editingHackathon.endDate}
                    onChange={(e) => setEditingHackathon({ ...editingHackathon, endDate: e.target.value })}
                    className="mt-1 block w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    required
                    value={editingHackathon.endTime}
                    onChange={(e) => setEditingHackathon({ ...editingHackathon, endTime: e.target.value })}
                    className="mt-1 block w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Deadline</label>
                <input
                  type="date"
                  required
                  value={editingHackathon.registrationDeadline}
                  onChange={(e) => setEditingHackathon({ ...editingHackathon, registrationDeadline: e.target.value })}
                  className="mt-1 block w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max Participants</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editingHackathon.maxParticipants}
                  onChange={(e) => setEditingHackathon({ ...editingHackathon, maxParticipants: e.target.value })}
                  className="mt-1 block w-full"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setEditingHackathon(null)
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Hackathons 
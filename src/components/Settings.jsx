import { useState, useEffect, useRef } from 'react'
import { getAuth } from 'firebase/auth'
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import ProfileTab from './Settings/ProfileTab'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('settings')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef(null)
  const auth = getAuth()

  // Initial data fetch
  useEffect(() => {
    const initializeUser = async () => {
      if (!auth.currentUser) {
        setLoading(false)
        return
      }

      try {
        const userRef = doc(db, 'users', auth.currentUser.uid)
        const userDoc = await getDoc(userRef)

        if (!userDoc.exists()) {
          // Create user document if it doesn't exist
          await setDoc(userRef, {
            email: auth.currentUser.email,
            role: 'user',
            createdAt: new Date().toISOString(),
            firstName: '',
            lastName: '',
            emailNotifications: false
          })
        } else {
          const userData = userDoc.data()
          setUser({ ...userData, id: auth.currentUser.uid })
          setFirstName(userData.firstName || '')
          setLastName(userData.lastName || '')
          setImagePreview(userData.photoURL || null)
        }
      } catch (error) {
        console.error('Error initializing user:', error)
        setNotification({
          type: 'error',
          message: 'Failed to initialize user data'
        })
      } finally {
        setLoading(false)
      }
    }

    initializeUser()

    // Set up real-time listener
    let unsubscribe = () => { }
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid)
      unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data()
          setUser({ ...userData, id: doc.id })
          setFirstName(userData.firstName || '')
          setLastName(userData.lastName || '')
          setImagePreview(userData.photoURL || null)
        }
      }, (error) => {
        console.error('Error in snapshot listener:', error)
      })
    }

    return () => unsubscribe()
  }, [auth.currentUser])

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

  const handleFileInput = (e) => {
    const file = e.target.files[0]
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

  const handleSave = async () => {
    console.log('Save button clicked')

    if (!auth.currentUser) {
      setNotification({ type: 'error', message: 'Please log in to save changes' })
      return
    }

    if (isSaving) {
      return
    }

    setIsSaving(true)

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid)
      let photoURL = user?.photoURL || null

      if (imageFile) {
        try {
          // Create a unique filename using timestamp
          const timestamp = Date.now()
          const filename = `${auth.currentUser.uid}_${timestamp}`
          const storageRef = ref(storage, `profile-images/${filename}`)

          // Upload the image
          const snapshot = await uploadBytes(storageRef, imageFile)
          photoURL = await getDownloadURL(snapshot.ref)
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          throw new Error('Failed to upload profile image')
        }
      }

      // Update user document
      const updateData = {
        firstName,
        lastName,
        emailNotifications: user?.emailNotifications || false
      }

      if (photoURL !== undefined) {
        updateData.photoURL = photoURL
      }

      await updateDoc(userRef, updateData)

      setNotification({ type: 'success', message: 'Profile updated successfully' })
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setNotification({
        type: 'error',
        message: error.message || 'Failed to update profile'
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderSettingsTab = () => (
    <div className="px-4 py-5 sm:p-6 space-y-8">
      {notification && (
        <div className={`p-4 rounded-md ${notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {notification.message}
          </p>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4">Account Information</h4>
        <dl className="space-y-6">
          <div className="sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-600">Email</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900 sm:mt-0 sm:col-span-2">{user?.email}</dd>
          </div>
          <div className="sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-600">Role</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900 capitalize sm:mt-0 sm:col-span-2">{user?.role}</dd>
          </div>
          <div className="sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-600">Member since</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900 sm:mt-0 sm:col-span-2">
              {new Date(user?.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Profile Image Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">Profile Image</label>
        <div
          className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="space-y-2 text-center">
            {imagePreview ? (
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-indigo-100 mb-4">
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Change photo
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      ref={fileInputRef}
                      onChange={handleFileInput}
                      accept="image/*"
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

      {/* Name Fields */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Email Notifications */}
      <div className="flex items-center">
        <input
          id="emailNotifications"
          name="emailNotifications"
          type="checkbox"
          checked={user?.emailNotifications || false}
          onChange={(e) => setUser(prev => ({ ...prev, emailNotifications: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
          Receive email notifications
        </label>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm ${isSaving
            ? 'bg-indigo-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            }`}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header with Tabs */}
          <div className="bg-indigo-600 px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-white">Account Settings</h3>
            </div>
            <div className="mt-4">
              <nav className="flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`${activeTab === 'settings'
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                    } px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150`}
                  aria-current={activeTab === 'settings' ? 'page' : undefined}
                >
                  Settings
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`${activeTab === 'profile'
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                    } px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150`}
                  aria-current={activeTab === 'profile' ? 'page' : undefined}
                >
                  Profile
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'settings' ? renderSettingsTab() : <ProfileTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings 
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getAuth } from 'firebase/auth'
import { doc, getDoc, addDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import html2canvas from 'html2canvas'

const SEVERITY_LEVELS = [
  { id: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
  { id: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { id: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'low', label: 'Low', color: 'bg-green-100 text-green-800' }
]

const CATEGORIES = [
  { id: 'ui', label: 'User Interface' },
  { id: 'functionality', label: 'Functionality' },
  { id: 'performance', label: 'Performance' },
  { id: 'security', label: 'Security' },
  { id: 'other', label: 'Other' }
]

const BugReportModal = ({ isOpen, onClose }) => {
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [category, setCategory] = useState('functionality')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [attachedFiles, setAttachedFiles] = useState([])
  const [showSystemInfo, setShowSystemInfo] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const location = useLocation()
  const auth = getAuth()

  // Capture screenshot when modal opens
  useEffect(() => {
    const capture = async () => {
      if (isOpen) {
        // Wait a bit longer to ensure the screen is in the right state
        await new Promise(resolve => setTimeout(resolve, 500))
        try {
          const canvas = await html2canvas(document.body)
          const dataUrl = canvas.toDataURL('image/png')
          setScreenshot(dataUrl)
          // Only show modal after we have the screenshot
          setShowModal(true)
        } catch (error) {
          console.error('Error capturing screenshot:', error)
          // Show modal even if screenshot fails
          setShowModal(true)
        }
      } else {
        setShowModal(false)
      }
    }
    capture()
  }, [isOpen])

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const isValid = file.size <= 5 * 1024 * 1024 // 5MB limit
      if (!isValid) {
        setError('Files must be less than 5MB')
      }
      return isValid
    })
    setAttachedFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent
    let browserInfo = 'Unknown'

    if (userAgent.includes('Firefox')) {
      browserInfo = 'Firefox'
    } else if (userAgent.includes('Chrome')) {
      browserInfo = 'Chrome'
    } else if (userAgent.includes('Safari')) {
      browserInfo = 'Safari'
    } else if (userAgent.includes('Edge')) {
      browserInfo = 'Edge'
    }

    return {
      browser: browserInfo,
      userAgent: userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const userId = auth.currentUser.uid
      const userDoc = await getDoc(doc(db, 'users', userId))
      const userData = userDoc.data()

      // Upload screenshot to Storage if it exists
      let screenshotUrl = null
      if (screenshot) {
        try {
          console.log('Uploading screenshot...')
          const timestamp = Timestamp.now().toMillis()
          const screenshotRef = ref(storage, `bug-reports/${timestamp}_${userId}.png`)
          await uploadString(screenshotRef, screenshot, 'data_url')
          screenshotUrl = await getDownloadURL(screenshotRef)
          console.log('Screenshot uploaded, URL:', screenshotUrl)
        } catch (error) {
          console.error('Error uploading screenshot:', error)
          setError('Failed to upload screenshot. Please try again.')
          setIsSubmitting(false)
          return
        }
      }

      const bugReport = {
        // User Information
        userId,
        userEmail: userData.email,
        userName: userData.firstName && userData.lastName
          ? `${userData.firstName} ${userData.lastName}`
          : 'Not provided',
        userRole: userData.role || 'user',
        accountCreated: userData.createdAt,
        lastLogin: auth.currentUser.metadata.lastSignInTime,

        // Bug Details
        description,
        severity,
        category,
        timestamp: Timestamp.now(),
        path: location.pathname,
        component: location.pathname.split('/').pop() || 'root',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        browserInfo: getBrowserInfo(),
        status: 'new',
        resolved: false,
        screenshotUrl,
        attachments: [], // Will be populated with storage URLs after upload
      }

      // Get client IP using a service
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json')
        if (ipResponse.ok) {
          const ipData = await ipResponse.json()
          bugReport.ipAddress = ipData.ip
        }
      } catch (error) {
        console.error('Error fetching IP address:', error)
        bugReport.ipAddress = 'Could not determine'
      }

      console.log('Attempting to submit bug report:', bugReport)
      const docRef = await addDoc(collection(db, 'bugReports'), bugReport)
      console.log('Bug report submitted successfully with ID:', docRef.id)

      onClose()
      setDescription('')
      setSeverity('medium')
      setCategory('functionality')
      setScreenshot(null)
      setAttachedFiles([])
    } catch (err) {
      console.error('Error submitting bug report:', err)
      setError('Failed to submit bug report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !showModal) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 modal-container">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Report a Bug</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Severity Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <div className="flex space-x-2">
                {SEVERITY_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setSeverity(level.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${severity === level.id
                      ? level.color + ' ring-2 ring-offset-2 ring-indigo-500'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                placeholder="Please describe the bug you encountered..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Screenshot Preview */}
            {screenshot && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Screenshot Preview
                </label>
                <div className="relative">
                  <img
                    src={screenshot}
                    alt="Bug Screenshot"
                    className="max-h-48 rounded border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setScreenshot(null)}
                    className="absolute top-2 right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Attachments
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
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
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">Up to 5 files, max 5MB each</p>
                </div>
              </div>

              {/* Attached Files List */}
              {attachedFiles.length > 0 && (
                <ul className="mt-2 divide-y divide-gray-200">
                  {attachedFiles.map((file, index) => (
                    <li key={index} className="py-2 flex justify-between items-center">
                      <span className="text-sm text-gray-500">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* System Information Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowSystemInfo(!showSystemInfo)}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <svg
                  className={`h-5 w-5 transform ${showSystemInfo ? 'rotate-90' : ''} transition-transform`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                <span className="ml-2">System Information</span>
              </button>

              {showSystemInfo && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                  <dl className="grid grid-cols-2 gap-2">
                    <dt>Browser:</dt>
                    <dd>{getBrowserInfo().browser}</dd>
                    <dt>Platform:</dt>
                    <dd>{getBrowserInfo().platform}</dd>
                    <dt>Screen Resolution:</dt>
                    <dd>{getBrowserInfo().screenResolution}</dd>
                    <dt>Window Size:</dt>
                    <dd>{getBrowserInfo().windowSize}</dd>
                    <dt>Version:</dt>
                    <dd>{import.meta.env.VITE_APP_VERSION || '1.0.0'}</dd>
                    <dt>Path:</dt>
                    <dd>{location.pathname}</dd>
                  </dl>
                </div>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-5 sm:mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BugReportModal 
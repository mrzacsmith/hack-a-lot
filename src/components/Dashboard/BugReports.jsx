import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'

const BugReports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [filter, setFilter] = useState('all') // all, new, inProgress, resolved
  const [fullScreenImage, setFullScreenImage] = useState(null)

  useEffect(() => {
    const reportsRef = collection(db, 'bugReports')
    const q = query(reportsRef, orderBy('timestamp', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsList = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate()
        }
      })
      setReports(reportsList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await updateDoc(doc(db, 'bugReports', reportId), {
        status: newStatus,
        resolved: newStatus === 'resolved'
      })
    } catch (error) {
      console.error('Error updating bug report status:', error)
    }
  }

  const handleReportClick = (report) => {
    console.log('Selected report:', report)
    setSelectedReport(report)
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'new':
        return 'bg-yellow-100 text-yellow-800'
      case 'inProgress':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true
    return report.status === filter
  })

  if (loading) {
    return <div className="text-center py-4">Loading...</div>
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex space-x-2">
        {['all', 'new', 'inProgress', 'resolved'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${filter === filterOption
              ? 'bg-indigo-100 text-indigo-800'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Reports list */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredReports.map((report) => (
            <li key={report.id}>
              <div
                className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleReportClick(report)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {report.description}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Reported by {report.userName} on {report.timestamp?.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium text-gray-900">Bug Report Details</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Status */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <select
                      value={selectedReport.status}
                      onChange={(e) => handleStatusChange(selectedReport.id, e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="new">New</option>
                      <option value="inProgress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedReport.description}</p>
                  </div>

                  {/* User Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">User Information</h4>
                    <div className="mt-1 text-sm text-gray-900">
                      <p>Name: {selectedReport.userName}</p>
                      <p>Email: {selectedReport.userEmail}</p>
                      <p>Role: {selectedReport.userRole}</p>
                      <p>IP Address: {selectedReport.ipAddress}</p>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Timestamps</h4>
                    <div className="mt-1 text-sm text-gray-900">
                      <p>Reported: {selectedReport.timestamp?.toLocaleString()}</p>
                      <p>Account Created: {new Date(selectedReport.accountCreated).toLocaleString()}</p>
                      <p>Last Login: {selectedReport.lastLogin}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* System Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">System Information</h4>
                    <div className="mt-1 text-sm text-gray-900">
                      <p>Version: {selectedReport.version}</p>
                      <p>Path: {selectedReport.path}</p>
                      <p>Component: {selectedReport.component}</p>
                      <p>Browser: {selectedReport.browserInfo.browser}</p>
                      <p>Platform: {selectedReport.browserInfo.platform}</p>
                      <p>Screen Resolution: {selectedReport.browserInfo.screenResolution}</p>
                      <p>Window Size: {selectedReport.browserInfo.windowSize}</p>
                      <p>Language: {selectedReport.browserInfo.language}</p>
                      <p>User Agent: {selectedReport.browserInfo.userAgent}</p>
                    </div>
                  </div>

                  {/* Screenshots */}
                  <div className="space-y-4">
                    {/* Automatic Screenshot */}
                    {selectedReport.screenshotUrl && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Automatic Screenshot</h4>
                        <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={selectedReport.screenshotUrl}
                            alt="Bug Report Screenshot"
                            className="w-full h-auto cursor-pointer"
                            onClick={() => setFullScreenImage(selectedReport.screenshotUrl)}
                            onError={(e) => console.error('Image load error:', e)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Additional Image */}
                    {selectedReport.additionalImageUrl && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Screenshot</h4>
                        <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={selectedReport.additionalImageUrl}
                            alt="Additional Screenshot"
                            className="w-full h-auto cursor-pointer"
                            onClick={() => setFullScreenImage(selectedReport.additionalImageUrl)}
                            onError={(e) => console.error('Image load error:', e)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Full Screen Image Modal */}
                  {fullScreenImage && (
                    <div
                      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] cursor-pointer"
                      onClick={() => setFullScreenImage(null)}
                    >
                      <div className="relative max-w-[90vw] max-h-[90vh]">
                        <button
                          onClick={() => setFullScreenImage(null)}
                          className="absolute -top-12 right-0 text-white hover:text-gray-300"
                        >
                          <span className="sr-only">Close</span>
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <img
                          src={fullScreenImage}
                          alt="Full Screen Screenshot"
                          className="max-w-full max-h-[90vh] object-contain"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Attachments</h4>
                      <ul className="mt-2 divide-y divide-gray-200 border border-gray-200 rounded-md">
                        {selectedReport.attachments.map((attachment, index) => (
                          <li key={index} className="px-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span className="ml-2 flex-1 w-0 truncate">{attachment.name}</span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Download
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BugReports 
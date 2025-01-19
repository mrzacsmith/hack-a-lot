import { useState, useEffect } from 'react'
import { getAuth } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import BugReports from './BugReports'

const Logs = () => {
  const [isAdmin, setIsAdmin] = useState(false)
  const auth = getAuth()
  const [activeTab, setActiveTab] = useState('bugs') // bugs, system, audit, etc.

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true)
        }
      }
    }

    checkAdminStatus()
  }, [auth.currentUser])

  if (!isAdmin) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Logs</h1>
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    )
  }

  const tabs = [
    { id: 'bugs', name: 'Bug Reports' },
    // Add more tabs here as needed
  ]

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Logs</h1>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === 'bugs' && <BugReports />}
        {/* Add more tab content components here */}
      </div>
    </div>
  )
}

export default Logs 
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const DashboardLayout = ({ setIsAuthenticated }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <Sidebar setIsAuthenticated={setIsAuthenticated} />

        {/* Main content */}
        <div className="flex-1 bg-white">
          <main className="h-full p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout 
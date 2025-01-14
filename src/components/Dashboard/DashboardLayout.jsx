import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const DashboardLayout = () => {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 bg-white">
        <main className="h-full p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout 
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { Toaster } from 'react-hot-toast'
import app from './firebase/config'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import Login from './components/Login'
import Register from './components/Register'
import PasswordReset from './components/PasswordReset'
import DashboardLayout from './components/Dashboard/DashboardLayout'
import Overview from './components/Dashboard/Overview'
import Submissions from './components/Dashboard/Submissions'
import Reviews from './components/Dashboard/Reviews'
import Users from './components/Dashboard/Users'
import Hackathons from './components/Dashboard/Hackathons'
import Settings from './components/Settings'
import ProtectedRoute from './components/ProtectedRoute'
import HackathonRegistration from './pages/HackathonRegistration'
import HackathonDetails from './pages/HackathonDetails'
import AboutSisu from './pages/AboutSisu'
import PublicProfile from './pages/PublicProfile'
import Logs from './components/Dashboard/Logs'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth(app)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route path="/about" element={<AboutSisu />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <DashboardLayout setIsAuthenticated={setIsAuthenticated} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="users" element={<Users />} />
          <Route path="hackathons" element={<Hackathons />} />
          <Route path="logs" element={<Logs />} />
        </Route>
        <Route
          path="/settings"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="/hackathons/:hackathonId/register" element={<HackathonRegistration />} />
        <Route path="/hackathons/:id" element={<HackathonDetails />} />
        <Route path="/profile/:profileUrl" element={<PublicProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

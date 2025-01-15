import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { Toaster } from 'react-hot-toast'
import app from './firebase/config'
import Navbar from './components/Navbar'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import Register from './components/Register'
import PasswordReset from './components/PasswordReset'
import DashboardLayout from './components/Dashboard/DashboardLayout'
import Overview from './components/Dashboard/Overview'
import Submissions from './components/Dashboard/Submissions'
import Reviews from './components/Dashboard/Reviews'
import Users from './components/Dashboard/Users'
import Settings from './components/Settings'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const auth = getAuth(app)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [auth])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Toaster position="top-right" />
        <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route
            path="/reset-password"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <PasswordReset />}
          />

          {/* Protected Dashboard Routes */}
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
          </Route>

          {/* Protected Settings Route */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App

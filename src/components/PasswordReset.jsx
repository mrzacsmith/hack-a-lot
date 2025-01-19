import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'
import app from '../firebase/config'

const PasswordReset = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const auth = getAuth(app)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess(true)
      setEmail('')
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address')
          break
        case 'auth/user-not-found':
          setError('No account found with this email')
          break
        default:
          setError('Failed to send reset email')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Reset Password</h2>
          <p className="text-sm text-gray-600 mb-8">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Password reset link sent! Check your email.
                  </h3>
                </div>
              </div>
            </div>
          )}
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-sisu-blue focus:border-sisu-blue sm:text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading
                ? 'bg-sisu-blue/70 cursor-not-allowed'
                : 'bg-sisu-blue hover:bg-sisu-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sisu-blue transition-colors duration-200'
                }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link to="/login" className="font-medium text-sisu-blue hover:text-sisu-blue-dark transition-colors duration-200">
              Back to Login
            </Link>
            <Link to="/register" className="font-medium text-sisu-blue hover:text-sisu-blue-dark transition-colors duration-200">
              Create new account
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PasswordReset 
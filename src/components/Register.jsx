import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import app from '../firebase/config'

const Register = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  const auth = getAuth(app)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Create user document with default role
      try {
        const maxRetries = 3;
        let retryCount = 0;
        let success = false;

        while (retryCount < maxRetries && !success) {
          try {
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              email: userCredential.user.email,
              role: 'user', // Default role
              createdAt: serverTimestamp()
            });
            success = true;
          } catch (error) {
            if (error.code === 'failed-precondition' || error.code === 'unavailable') {
              // Firestore is offline, wait and retry
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
              retryCount++;
            } else {
              throw error;
            }
          }
        }

        if (!success) {
          throw new Error('Failed to create user document after multiple retries');
        }
      } catch (error) {
        console.error('Error creating user document:', error);
        setError('Account created but profile setup failed. Please try logging in again.');
        return;
      }

      setIsAuthenticated(true)
      navigate('/dashboard')
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Email already registered')
          break
        case 'auth/invalid-email':
          setError('Invalid email address')
          break
        case 'auth/weak-password':
          setError('Password should be at least 6 characters')
          break
        default:
          setError('Failed to create account')
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">Create Account</h2>
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
          <div className="space-y-4">
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-sisu-blue focus:border-sisu-blue sm:text-sm"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="button"
                    className="px-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-sisu-blue focus:border-sisu-blue sm:text-sm"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="button"
                    className="px-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sisu-blue hover:bg-sisu-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sisu-blue transition-colors duration-200"
            >
              Create Account
            </button>
          </div>

          <div className="text-sm text-center">
            <Link to="/login" className="font-medium text-sisu-blue hover:text-sisu-blue-dark">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register 
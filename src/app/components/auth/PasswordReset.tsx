'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/app/config/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'

const RATE_LIMIT_DURATION = 60 * 1000 // 1 minute
const MAX_ATTEMPTS = 3

interface RateLimit {
  attempts: number
  lastAttempt: number
}

export default function PasswordReset() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [rateLimit, setRateLimit] = useState<RateLimit>({ attempts: 0, lastAttempt: 0 })
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    // Only runs on client
    const stored = localStorage.getItem('passwordResetRateLimit');
    if (stored) {
      setRateLimit(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('passwordResetRateLimit', JSON.stringify(rateLimit))

    if (rateLimit.attempts >= MAX_ATTEMPTS) {
      const timeLeft = RATE_LIMIT_DURATION - (Date.now() - rateLimit.lastAttempt)
      if (timeLeft > 0) {
        setCountdown(Math.ceil(timeLeft / 1000))
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              setRateLimit({ attempts: 0, lastAttempt: 0 })
              return 0
            }
            return prev - 1
          })
        }, 1000)
        return () => clearInterval(timer)
      } else {
        setRateLimit({ attempts: 0, lastAttempt: 0 })
      }
    }
  }, [rateLimit])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check rate limiting
    if (rateLimit.attempts >= MAX_ATTEMPTS) {
      const timeLeft = RATE_LIMIT_DURATION - (Date.now() - rateLimit.lastAttempt)
      if (timeLeft > 0) {
        setMessage({
          type: 'error',
          text: `Too many attempts. Please try again in ${Math.ceil(timeLeft / 1000)} seconds.`
        })
        return
      }
    }

    setLoading(true)
    setMessage(null)

    try {
      // Configure password reset options
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/signin`, // URL to redirect to after password reset
        handleCodeInApp: true
      }

      await sendPasswordResetEmail(auth, email, actionCodeSettings)
      
      // Update rate limit
      setRateLimit(prev => ({
        attempts: prev.attempts + 1,
        lastAttempt: Date.now()
      }))

      setMessage({
        type: 'success',
        text: 'Password reset email sent! Please check your inbox and spam folder.'
      })
      setEmail('')
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email. Please try again.'
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'If an account exists with this email, a password reset link will be sent.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.'
      }

      setMessage({
        type: 'error',
        text: errorMessage
      })
      
      // Update rate limit for failed attempts
      setRateLimit(prev => ({
        attempts: prev.attempts + 1,
        lastAttempt: Date.now()
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handlePasswordReset}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={countdown > 0}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || countdown > 0}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  (loading || countdown > 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                ) : countdown > 0 ? (
                  `Try again in ${countdown}s`
                ) : (
                  'Send reset link'
                )}
              </button>
            </div>
          </form>

          {message && (
            <div className={`mt-4 p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500">
            <p>For security reasons:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Reset links expire after 1 hour</li>
              <li>You can only request {MAX_ATTEMPTS} resets per minute</li>
              <li>Check your spam folder if you don&apos;t see the email</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 
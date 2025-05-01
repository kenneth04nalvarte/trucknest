'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/config/firebase'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthWidth } from '@/app/utils/passwordValidation'

export default function NewPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const oobCode = searchParams.get('oobCode') // Firebase's reset code from URL

  const passwordValidation = validatePassword(password)

  useEffect(() => {
    const validateCode = async () => {
      if (!oobCode) {
        setError('Invalid password reset link')
        setValidating(false)
        return
      }

      try {
        await verifyPasswordResetCode(auth, oobCode)
        setValidating(false)
      } catch (error) {
        setError('This password reset link has expired or is invalid')
        setValidating(false)
      }
    }

    validateCode()
  }, [oobCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwordValidation.isValid) {
      setError('Please meet all password requirements')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!oobCode) {
      setError('Invalid password reset link')
      return
    }

    setLoading(true)

    try {
      await confirmPasswordReset(auth, oobCode, password)
      setSuccess(true)
      setTimeout(() => {
        router.push('/signin')
      }, 3000)
    } catch (error: any) {
      setError(error.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create new password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {success ? (
            <div className="bg-green-50 text-green-800 p-4 rounded-md">
              Password successfully reset! Redirecting to sign in...
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="h-2 rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          getPasswordStrengthColor(passwordValidation.strength)
                        } ${
                          getPasswordStrengthWidth(passwordValidation.strength)
                        }`}
                      ></div>
                    </div>
                    <ul className="mt-2 text-sm space-y-1">
                      {passwordValidation.errors.map((error, index) => (
                        <li key={index} className="text-red-600">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !passwordValidation.isValid || !confirmPassword}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    (loading || !passwordValidation.isValid || !confirmPassword)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                  ) : (
                    'Reset password'
                  )}
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="mt-4 bg-red-50 text-red-800 p-4 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
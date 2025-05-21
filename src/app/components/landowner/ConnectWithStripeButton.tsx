'use client'

import { useState } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { db } from '@/app/config/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

export default function ConnectWithStripeButton() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Check if user already has a Stripe account
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()

      if (userData?.stripeAccountId) {
        setError('You already have a Stripe account connected')
        return
      }

      // Create Stripe Connect account link
      const response = await fetch('/api/create-stripe-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user!.uid,
          email: user!.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Stripe account')
      }

      // Redirect to Stripe Connect onboarding
      window.location.href = data.url
    } catch (err) {
      console.error('Error connecting Stripe:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect Stripe account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Connect with Stripe</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect your Stripe account to start receiving payments for your parking spots.
          </p>
        </div>
        <button
          onClick={handleConnect}
          disabled={loading}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Connecting...' : 'Connect with Stripe'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </div>
  )
} 
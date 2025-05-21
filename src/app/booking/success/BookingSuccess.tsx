'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import { db } from '@/app/config/firebase'
import { doc, getDoc } from 'firebase/firestore'

interface BookingDetails {
  id: string
  propertyId: string
  startDate: Date
  endDate: Date
  totalPrice: number
  status: string
  paymentStatus: string
  propertyName?: string
  propertyAddress?: string
}

export default function BookingSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = searchParams?.get('session_id')
    if (!sessionId) {
      setError('No session ID found')
      setLoading(false)
      return
    }

    const fetchBookingDetails = async () => {
      try {
        const bookingDoc = await getDoc(doc(db, 'bookings', sessionId))
        if (!bookingDoc.exists()) {
          throw new Error('Booking not found')
        }

        const bookingData = bookingDoc.data()
        // Fetch property details
        const propertyDoc = await getDoc(doc(db, 'properties', bookingData.propertyId))
        const propertyData = propertyDoc.data()

        setBooking({
          id: bookingDoc.id,
          propertyId: bookingData.propertyId,
          startDate: bookingData.startDate.toDate(),
          endDate: bookingData.endDate.toDate(),
          totalPrice: bookingData.totalPrice,
          status: bookingData.status,
          paymentStatus: bookingData.paymentStatus,
          propertyName: propertyData?.name,
          propertyAddress: propertyData?.address,
        })
      } catch (err) {
        console.error('Error fetching booking details:', err)
        setError('Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }

    fetchBookingDetails()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!booking) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Booking Confirmed!
              </h2>
              <p className="text-gray-600">
                Your parking spot has been successfully booked and paid for.
              </p>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <dl className="divide-y divide-gray-200">
                <div className="py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Property</dt>
                  <dd className="text-sm text-gray-900">{booking.propertyName}</dd>
                </div>
                <div className="py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="text-sm text-gray-900">{booking.propertyAddress}</dd>
                </div>
                <div className="py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                  <dd className="text-sm text-gray-900">
                    {booking.startDate.toLocaleDateString()}
                  </dd>
                </div>
                <div className="py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">End Date</dt>
                  <dd className="text-sm text-gray-900">
                    {booking.endDate.toLocaleDateString()}
                  </dd>
                </div>
                <div className="py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    ${booking.totalPrice.toFixed(2)}
                  </dd>
                </div>
                <div className="py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {booking.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                View in Dashboard
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
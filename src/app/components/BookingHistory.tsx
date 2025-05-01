'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '@/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  updateDoc,
  doc
} from 'firebase/firestore'

interface Booking {
  id: string
  userId: string
  parkingSpotId: string
  ownerId: string
  startDate: Timestamp
  endDate: Timestamp
  vehicleType: string
  specialRequirements: string
  location: {
    address: string
    lat: number
    lng: number
  }
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  createdAt: Timestamp
  updatedAt: Timestamp
  parkingSpotName?: string
  ownerName?: string
}

export default function BookingHistory() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Booking['status']>('all')
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'price'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    if (user) {
      loadBookings()
    }
  }, [user, statusFilter])

  const loadBookings = async () => {
    try {
      let bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      )

      if (statusFilter !== 'all') {
        bookingsQuery = query(
          collection(db, 'bookings'),
          where('userId', '==', user?.uid),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc')
        )
      }

      const snapshot = await getDocs(bookingsQuery)
      const bookingsList = await Promise.all(snapshot.docs.map(async doc => {
        const bookingData = { id: doc.id, ...doc.data() } as Booking
        
        // Get parking spot details
        const spotDoc = await getDocs(query(
          collection(db, 'parkingSpots'),
          where('id', '==', bookingData.parkingSpotId)
        ))
        if (!spotDoc.empty) {
          const spotData = spotDoc.docs[0].data()
          bookingData.parkingSpotName = spotData.name
        }

        // Get owner details
        const ownerDoc = await getDocs(query(
          collection(db, 'users'),
          where('id', '==', bookingData.ownerId)
        ))
        if (!ownerDoc.empty) {
          const ownerData = ownerDoc.docs[0].data()
          bookingData.ownerName = `${ownerData.firstName} ${ownerData.lastName}`
        }

        return bookingData
      }))
      setBookings(bookingsList)
    } catch (error) {
      console.error('Error loading bookings:', error)
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      const bookingRef = doc(db, 'bookings', bookingId)
      await updateDoc(bookingRef, {
        status: 'cancelled',
        updatedAt: Timestamp.now()
      })
      await loadBookings()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      setError('Failed to cancel booking')
    }
  }

  const filteredBookings = [...bookings].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc'
        ? a.startDate.seconds - b.startDate.seconds
        : b.startDate.seconds - a.startDate.seconds
    }
    if (sortBy === 'status') {
      return sortOrder === 'asc'
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status)
    }
    // price
    return sortOrder === 'asc'
      ? a.totalPrice - b.totalPrice
      : b.totalPrice - a.totalPrice
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Booking History</h2>
        <div className="flex space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3"
          >
            <option value="date">Sort by Date</option>
            <option value="status">Sort by Status</option>
            <option value="price">Sort by Price</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No bookings found</p>
        ) : (
          filteredBookings.map(booking => (
            <div
              key={booking.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{booking.parkingSpotName || 'Unknown Location'}</h3>
                  <p className="text-sm text-gray-500">{booking.location.address}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Owner: </span>
                      {booking.ownerName || 'Unknown'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Dates: </span>
                      {new Date(booking.startDate.seconds * 1000).toLocaleDateString()} - {new Date(booking.endDate.seconds * 1000).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Vehicle Type: </span>
                      {booking.vehicleType}
                    </p>
                    {booking.specialRequirements && (
                      <p className="text-sm">
                        <span className="font-medium">Special Requirements: </span>
                        {booking.specialRequirements}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                    ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </div>
                  <p className="mt-2 text-lg font-bold text-gray-900">
                    ${booking.totalPrice.toFixed(2)}
                  </p>
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="mt-2 text-sm text-red-600 hover:text-red-900"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {error && (
        <div className="mt-4 text-red-600 text-sm">{error}</div>
      )}
    </div>
  )
} 
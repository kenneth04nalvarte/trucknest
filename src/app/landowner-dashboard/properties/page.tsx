'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/app/config/firebase'
import ConnectWithStripeButton from '../../components/landowner/ConnectWithStripeButton'

interface Property {
  id: string
  name: string
  address: string
  imageUrl?: string
  hourlyRate: number
  dailyRate: number
  weeklyRate: number
  monthlyRate: number
  availableSpaces: number
  amenities: string[]
  status: 'pending' | 'active' | 'inactive'
  ownerId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface Notification {
  id: string
  message: string
  status: 'read' | 'unread'
  type: string
  createdAt: Timestamp
}

const sidebarLinks = [
  { href: '/landowner-dashboard/properties', label: 'My Properties' },
  { href: '/landowner-dashboard/booking-requests', label: 'Booking Requests' },
  { href: '/landowner-dashboard/earnings', label: 'Earnings' },
  { href: '/landowner-dashboard/profile', label: 'Profile' },
]

export default function MyProperties() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!user?.uid) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch properties
        const propertiesQuery = query(
          collection(db, 'properties'),
          where('ownerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
        const propertiesSnapshot = await getDocs(propertiesQuery)
        const propertiesData = propertiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Property[]
        setProperties(propertiesData)

        // Fetch notifications
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
        const notificationsSnapshot = await getDocs(notificationsQuery)
        const notificationsData = notificationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[]
        setNotifications(notificationsData)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.uid])

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="My Properties"
        sidebarLinks={sidebarLinks}
      >
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <ConnectWithStripeButton />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Notifications</h2>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-gray-500">No notifications</p>
            ) : (
              <ul className="space-y-2">
                {notifications.map(notification => (
                  <li
                    key={notification.id}
                    className={`p-3 rounded-lg ${
                      notification.status === 'unread' ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    <p className={notification.status === 'unread' ? 'font-semibold' : ''}>
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {notification.createdAt.toDate().toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Properties</h2>
              <Link
                href="/landowner-dashboard/properties/add"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-semibold transition-colors"
              >
                List New Property
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg aspect-w-16 aspect-h-9 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No properties found. List your first property!</p>
                <Link
                  href="/landowner-dashboard/properties/add"
                  className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-md font-semibold transition-colors"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <div key={property.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="aspect-w-16 aspect-h-9 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                      {property.imageUrl ? (
                        <img
                          src={property.imageUrl}
                          alt={property.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-4xl">🏞️</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {property.name || 'Unnamed Property'}
                    </h3>
                    <p className="text-gray-600 mb-2">{property.address || 'No address provided'}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-green-600 font-semibold">
                        ${property.hourlyRate}/hour
                      </span>
                      <span className="text-gray-600">
                        {property.availableSpaces} spots available
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {property.amenities?.map((amenity) => (
                        <span
                          key={amenity}
                          className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <Link
                        href={`/landowner-dashboard/properties/update-availability?id=${property.id}`}
                        className="text-orange-600 hover:text-orange-700 font-semibold"
                      >
                        Update Availability
                      </Link>
                      <Link
                        href={`/landowner-dashboard/properties/pending-requests?id=${property.id}`}
                        className="text-gray-600 hover:text-gray-700 font-semibold"
                      >
                        View Requests
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
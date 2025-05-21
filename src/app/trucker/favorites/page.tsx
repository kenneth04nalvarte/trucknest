'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import { db } from '@/app/config/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { User } from 'firebase/auth'
import { Property } from '@/app/types/property'
import FavoriteLandMembers from '@/app/components/trucker/FavoriteLandMembers'
import DashboardLayout from '@/app/components/DashboardLayout'

const sidebarLinks = [
  { href: '/trucker/dashboard', label: 'Dashboard', icon: 'HomeIcon' },
  { href: '/trucker/favorites', label: 'Favorites', icon: 'HeartIcon' },
  { href: '/trucker/bookings', label: 'My Bookings', icon: 'CalendarIcon' },
  { href: '/trucker/profile', label: 'Profile', icon: 'UserIcon' },
]

export default function TruckerFavoritesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Property[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push('/signin')
        return
      }

      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)))
      const userData = userDoc.docs[0]?.data()

      if (!userData || userData.role !== 'truckmember') {
        router.push('/')
        return
      }

      try {
        // Fetch user's favorite properties
        const favoritesQuery = query(
          collection(db, 'favorites'),
          where('userId', '==', user.uid),
          where('type', '==', 'property')
        )
        const favoritesSnapshot = await getDocs(favoritesQuery)
        const favoriteIds = favoritesSnapshot.docs.map(doc => doc.data().propertyId)

        // Fetch the actual properties
        const properties: Property[] = []
        for (const propertyId of favoriteIds) {
          const propertyDoc = await getDocs(query(collection(db, 'properties'), where('id', '==', propertyId)))
          const propertyData = propertyDoc.docs[0]?.data()
          if (propertyData) {
            properties.push(propertyData as Property)
          }
        }

        setFavorites(properties)
      } catch (err) {
        console.error('Error fetching favorites:', err)
        setError('Failed to load favorite properties')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [user, router])

  if (loading) {
    return (
      <DashboardLayout title="My Favorites" sidebarLinks={sidebarLinks}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your favorites...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="My Favorites" sidebarLinks={sidebarLinks}>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="My Favorites" sidebarLinks={sidebarLinks}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Favorites</h1>

          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">You haven't added any properties to your favorites yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((property) => (
                <div
                  key={property.id}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
                >
                  {property.images && property.images[0] && (
                    <div className="relative h-48">
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900">{property.title}</h3>
                    <p className="mt-2 text-sm text-gray-500">{property.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-orange-600">${property.price}/night</span>
                      <button
                        onClick={() => router.push(`/properties/${property.id}`)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12">
          <FavoriteLandMembers
            onError={(message) => setError(message)}
            onLoadingChange={setLoading}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
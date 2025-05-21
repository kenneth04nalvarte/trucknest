'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/app/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore'
import { Property } from '@/types/property'

interface BaseLandMember {
  name: string
  email: string
  phone: string
  address: string
  rating: number
  totalBookings: number
  parkingSpots: {
    id: string
    name: string
    pricePerHour: number
  }[]
}

interface LandMember extends Omit<BaseLandMember, 'id'> {
  id: string;
  properties: Property[];
  verificationStatus: 'verified' | 'pending' | 'unverified';
}

interface Favorite {
  id: string
  userId: string
  landmemberId: string
  createdAt: Timestamp
}

export default function FavoriteLandMembers() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favorites, setFavorites] = useState<(Favorite & { landmember: LandMember })[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<LandMember[]>([])

  useEffect(() => {
    if (!user) return
    loadFavorites()
  }, [user])

  const loadFavorites = async () => {
    try {
      // Get user's favorites
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', user?.uid)
      )
      const favoritesSnapshot = await getDocs(favoritesQuery)
      const favoritesData = favoritesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Favorite[]

      // Get landmember details for each favorite
      const favoritesWithDetails = await Promise.all(
        favoritesData.map(async favorite => {
          const landmemberData = await fetchLandMemberData(favorite.landmemberId)
          if (landmemberData) {
            return {
              ...favorite,
              landmember: landmemberData
            }
          }
          return null
        })
      )

      setFavorites(favoritesWithDetails.filter(Boolean) as (Favorite & { landmember: LandMember })[])
      setLoading(false)
    } catch (err) {
      console.error('Error loading favorites:', err)
      setError('Failed to load favorite land members')
      setLoading(false)
    }
  }

  const fetchLandMemberData = async (landmemberId: string) => {
    try {
      const landmemberDoc = await getDocs(query(collection(db, 'users'), where('id', '==', landmemberId)));
      if (!landmemberDoc.empty) {
        const landmemberData = landmemberDoc.docs[0].data();
        const landmemberId = landmemberDoc.docs[0].id;
        return {
          ...landmemberData,
          id: landmemberId
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching land member data:', error);
      return null;
    }
  };

  const searchLandMembers = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    try {
      const landmembersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'landmember'),
        where('name', '>=', term),
        where('name', '<=', term + '\uf8ff')
      )
      const snapshot = await getDocs(landmembersQuery)
      const landmembersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LandMember[]

      setSearchResults(landmembersData)
    } catch (err) {
      console.error('Error searching land members:', err)
      setError('Failed to search land members')
    }
  }

  const addToFavorites = async (landmember: LandMember) => {
    try {
      await addDoc(collection(db, 'favorites'), {
        userId: user?.uid,
        landmemberId: landmember.id,
        createdAt: Timestamp.now()
      })

      setSearchResults([])
      setSearchTerm('')
      loadFavorites()
    } catch (err) {
      console.error('Error adding to favorites:', err)
      setError('Failed to add to favorites')
    }
  }

  const removeFromFavorites = async (favoriteId: string) => {
    try {
      await deleteDoc(doc(db, 'favorites', favoriteId))
      loadFavorites()
    } catch (err) {
      console.error('Error removing from favorites:', err)
      setError('Failed to remove from favorites')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Land Members */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Find Land Members</h2>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                searchLandMembers(e.target.value)
              }}
              className="block w-full border rounded-md shadow-sm py-2 px-3"
              placeholder="Search land members by name"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-lg divide-y">
              {searchResults.map(landmember => (
                <div key={landmember.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{landmember.name}</h3>
                      <p className="text-sm text-gray-500">{landmember.address}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-500">
                          Rating: {landmember.rating.toFixed(1)} • {landmember.totalBookings} bookings
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToFavorites(landmember)}
                      className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                      Add to Favorites
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Favorite Land Members List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">My Favorite Land Members</h2>
          <div className="space-y-4">
            {favorites.map(favorite => (
              <div key={favorite.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{favorite.landmember.name}</h3>
                    <p className="text-sm text-gray-500">{favorite.landmember.address}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500">
                        Rating: {favorite.landmember.rating.toFixed(1)} • {favorite.landmember.totalBookings} bookings
                      </span>
                    </div>
                    {favorite.landmember.parkingSpots.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-700">Available Parking Spots:</h4>
                        <div className="mt-1 space-y-1">
                          {favorite.landmember.parkingSpots.map(spot => (
                            <p key={spot.id} className="text-sm text-gray-500">
                              {spot.name} - ${spot.pricePerHour}/hour
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => removeFromFavorites(favorite.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {favorites.length === 0 && (
              <p className="text-gray-500 text-center">No favorite land members added yet</p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
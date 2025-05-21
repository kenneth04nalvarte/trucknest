'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { db } from '@/app/config/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

interface FavoriteLandMembersProps {
  onError: (message: string) => void
  onLoadingChange: (loading: boolean) => void
}

export default function FavoriteLandMembers({ onError, onLoadingChange }: FavoriteLandMembersProps) {
  const { user } = useAuth()
  const [favoriteLandMembers, setFavoriteLandMembers] = useState<any[]>([])

  useEffect(() => {
    const fetchFavoriteLandMembers = async () => {
      if (!user) return

      try {
        onLoadingChange(true)
        const favoritesQuery = query(
          collection(db, 'favorites'),
          where('userId', '==', user.uid),
          where('type', '==', 'landmember')
        )
        const favoritesSnapshot = await getDocs(favoritesQuery)
        const landMemberIds = favoritesSnapshot.docs.map(doc => doc.data().landMemberId)

        const landMembers: any[] = []
        for (const landMemberId of landMemberIds) {
          const landMemberDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', landMemberId)))
          const landMemberData = landMemberDoc.docs[0]?.data()
          if (landMemberData) {
            landMembers.push(landMemberData)
          }
        }

        setFavoriteLandMembers(landMembers)
      } catch (err) {
        console.error('Error fetching favorite land members:', err)
        onError('Failed to load favorite land members')
      } finally {
        onLoadingChange(false)
      }
    }

    fetchFavoriteLandMembers()
  }, [user, onError, onLoadingChange])

  if (favoriteLandMembers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">You haven't added any land members to your favorites yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Favorite Land Members</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {favoriteLandMembers.map((landMember) => (
          <div
            key={landMember.uid}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-medium text-orange-600">
                    {landMember.displayName?.[0] || landMember.email?.[0] || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {landMember.displayName || 'Anonymous Land Member'}
                  </h3>
                  <p className="text-sm text-gray-500">{landMember.email}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'firebase/auth'
import { useAuth } from '@/context/AuthContext'
import NotificationManager from '@/components/admin/NotificationManager'

interface CustomUser extends User {
  role?: string
}

export default function AdminNotificationsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const customUser = user as CustomUser

  useEffect(() => {
    if (!loading && (!customUser || customUser.role !== 'admin')) {
      router.push('/signin')
    }
  }, [customUser, loading, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!customUser || customUser.role !== 'admin') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Notification Management</h1>
      <NotificationManager />
    </div>
  )
} 
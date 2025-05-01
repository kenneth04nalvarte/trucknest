'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter } from 'next/navigation'
import AdminAnalyticsDashboard from '@/app/components/AdminAnalyticsDashboard'

export default function AdminAnalyticsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin')
      } else {
        // Check if user has admin role
        // This should be replaced with your actual admin check logic
        setIsAdmin(true)
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
      <AdminAnalyticsDashboard />
    </div>
  )
} 
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'firebase/auth'
import { useAuth } from '@/context/AuthContext'
import LanguageManager from '@/components/admin/LanguageManager'

interface CustomUser extends User {
  role?: string;
}

export default function AdminLanguagesPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const customUser = user as CustomUser

  useEffect(() => {
    if (!loading && (!customUser || customUser.role !== 'admin')) {
      router.push('/signin')
    }
  }, [customUser, loading, router])

  if (loading || !customUser || customUser.role !== 'admin') {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Language Management</h1>
      <LanguageManager />
    </div>
  )
} 
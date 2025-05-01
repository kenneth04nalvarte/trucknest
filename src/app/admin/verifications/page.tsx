'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import AdminVerificationPanel from '../../components/AdminVerificationPanel'
import { db } from '../../config/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function AdminVerificationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setCheckingRole(false)
        return
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const userData = userDoc.data()
        setIsAdmin(userData?.role === 'admin')
      } catch (error) {
        console.error('Error checking admin role:', error)
      } finally {
        setCheckingRole(false)
      }
    }

    if (!loading) {
      checkAdminRole()
    }
  }, [user, loading])

  useEffect(() => {
    if (!loading && !checkingRole) {
      if (!user) {
        router.push('/signin?redirect=/admin/verifications')
      } else if (!isAdmin) {
        router.push('/')
      }
    }
  }, [user, loading, checkingRole, isAdmin, router])

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage property owner verifications and user accounts
          </p>
        </div>
        <AdminVerificationPanel />
      </div>
    </div>
  )
} 
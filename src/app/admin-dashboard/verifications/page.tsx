'use client'

import { useState, useEffect } from 'react'
import AdminDashboardLayout from '../layout'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/config/firebase'

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        const verificationsRef = collection(db, 'verifications')
        const snapshot = await getDocs(verificationsRef)
        const verificationsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setVerifications(verificationsList)
      } catch (error) {
        console.error('Error fetching verifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVerifications()
  }, [])

  const handleVerification = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const verificationRef = doc(db, 'verifications', id)
      await updateDoc(verificationRef, { status })
      setVerifications(prev =>
        prev.map(verification =>
          verification.id === id
            ? { ...verification, status }
            : verification
        )
      )
    } catch (error) {
      console.error('Error updating verification:', error)
    }
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">Verifications</h1>
        
        {loading ? (
          <p>Loading verifications...</p>
        ) : (
          <div className="grid gap-6">
            {verifications.length === 0 ? (
              <p>No pending verifications.</p>
            ) : (
              verifications.map((verification) => (
                <div key={verification.id} className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold text-navy">
                    {verification.type === 'property' ? 'Property Verification' : 'User Verification'}
                  </h2>
                  <p className="text-gray-600">Status: {verification.status || 'Pending'}</p>
                  <div className="mt-4 flex gap-4">
                    <button
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      onClick={() => handleVerification(verification.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      onClick={() => handleVerification(verification.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  )
} 
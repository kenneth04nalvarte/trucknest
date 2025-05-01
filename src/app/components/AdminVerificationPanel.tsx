'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '@/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  orderBy
} from 'firebase/firestore'

interface VerificationRequest {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  businessName: string
  businessType: string
  taxId: string
  verificationStatus: 'pending' | 'approved' | 'rejected'
  createdAt: Timestamp
  updatedAt: Timestamp
}

export default function AdminVerificationPanel() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    if (user) {
      loadVerificationRequests()
    }
  }, [user, filter])

  const loadVerificationRequests = async () => {
    try {
      let verificationQuery = query(
        collection(db, 'users'),
        where('role', '==', 'property-owner'),
        orderBy('createdAt', 'desc')
      )

      if (filter !== 'all') {
        verificationQuery = query(
          collection(db, 'users'),
          where('role', '==', 'property-owner'),
          where('verificationStatus', '==', filter),
          orderBy('createdAt', 'desc')
        )
      }

      const snapshot = await getDocs(verificationQuery)
      const requestsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VerificationRequest[]
      setRequests(requestsList)
    } catch (error) {
      console.error('Error loading verification requests:', error)
      setError('Failed to load verification requests')
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const userRef = doc(db, 'users', requestId)
      await updateDoc(userRef, {
        verificationStatus: status,
        updatedAt: Timestamp.now()
      })
      await loadVerificationRequests()
    } catch (error) {
      console.error('Error updating verification status:', error)
      setError('Failed to update verification status')
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
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Property Owner Verifications</h2>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-600 text-sm">{error}</div>
      )}

      <div className="space-y-4">
        {requests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No {filter === 'all' ? '' : filter} verification requests found
          </p>
        ) : (
          requests.map(request => (
            <div
              key={request.id}
              className="border border-gray-200 rounded-md p-4"
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="font-medium">{request.firstName} {request.lastName}</h3>
                  <p className="text-sm text-gray-500">{request.email}</p>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">Business: </span>
                    {request.businessName}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Type: </span>
                    {request.businessType}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Tax ID: </span>
                    {request.taxId}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded ${
                    request.verificationStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : request.verificationStatus === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {request.verificationStatus.charAt(0).toUpperCase() + request.verificationStatus.slice(1)}
                  </span>
                </div>

                {request.verificationStatus === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleVerification(request.id, 'approved')}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerification(request.id, 'rejected')}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 
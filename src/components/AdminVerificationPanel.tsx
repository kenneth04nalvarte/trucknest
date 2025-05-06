import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/app/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore'

interface Verification {
  id: string
  userId: string
  type: 'landowner' | 'trucker'
  status: 'pending' | 'approved' | 'rejected'
  documents: {
    type: string
    url: string
  }[]
  businessDocuments?: {
    type: string
    url: string
  }[]
  createdAt: string
  updatedAt: string
}

export default function AdminVerificationPanel() {
  const { user } = useAuth()
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null)

  useEffect(() => {
    if (user) {
      loadVerifications()
    }
  }, [user])

  const loadVerifications = async () => {
    try {
      const verificationsQuery = query(
        collection(db, 'verifications'),
        where('status', '==', 'pending')
      )
      const snapshot = await getDocs(verificationsQuery)
      const verificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Verification[]
      setVerifications(verificationsData)
      setLoading(false)
    } catch (err) {
      console.error('Error loading verifications:', err)
      setError('Failed to load verifications')
      setLoading(false)
    }
  }

  const handleApprove = async (verificationId: string) => {
    try {
      const verificationRef = doc(db, 'verifications', verificationId)
      await updateDoc(verificationRef, {
        status: 'approved',
        updatedAt: new Date().toISOString()
      })
      loadVerifications()
      setSelectedVerification(null)
    } catch (err) {
      console.error('Error approving verification:', err)
      setError('Failed to approve verification')
    }
  }

  const handleReject = async (verificationId: string) => {
    try {
      const verificationRef = doc(db, 'verifications', verificationId)
      await updateDoc(verificationRef, {
        status: 'rejected',
        updatedAt: new Date().toISOString()
      })
      loadVerifications()
      setSelectedVerification(null)
    } catch (err) {
      console.error('Error rejecting verification:', err)
      setError('Failed to reject verification')
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
      {/* Verifications List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Pending Verifications</h2>
          <div className="space-y-4">
            {verifications.map(verification => (
              <div
                key={verification.id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedVerification(verification)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {verification.type === 'landowner' ? 'Landowner' : 'Trucker'} Verification
                    </h3>
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(verification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                    Pending
                  </span>
                </div>
              </div>
            ))}
            {verifications.length === 0 && (
              <p className="text-center text-gray-500 py-8">No pending verifications</p>
            )}
          </div>
        </div>
      </div>

      {/* Verification Details Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Verification Details</h3>
              <button
                onClick={() => setSelectedVerification(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Documents */}
              <div>
                <h3 className="font-semibold mb-2">Documents</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedVerification.documents.map((doc, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-900">{doc.type}</p>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Document
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Documents */}
              {selectedVerification.businessDocuments && (
                <div>
                  <h3 className="font-semibold mb-2">Business Documents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedVerification.businessDocuments.map((doc, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-900">{doc.type}</p>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View Document
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleReject(selectedVerification.id)}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedVerification.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 
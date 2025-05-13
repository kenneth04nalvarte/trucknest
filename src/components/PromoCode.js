import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/app/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc
} from 'firebase/firestore'

interface PromoCode {
  id: string
  code: string
  discount: number
  type: 'percentage' | 'fixed'
  minPurchase: number
  maxUses: number
  currentUses: number
  validUntil: string
  createdAt: string
}

export default function PromoCode() {
  const { user } = useAuth()
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newCode, setNewCode] = useState('')
  const [applyingCode, setApplyingCode] = useState(false)

  useEffect(() => {
    if (user) {
      loadPromoCodes()
    }
  }, [user])

  const loadPromoCodes = async () => {
    try {
      const promoCodesQuery = query(
        collection(db, 'promoCodes'),
        where('userId', '==', user?.uid)
      )
      const snapshot = await getDocs(promoCodesQuery)
      const codes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PromoCode[]
      setPromoCodes(codes)
      setLoading(false)
    } catch (err) {
      console.error('Error loading promo codes:', err)
      setError('Failed to load promo codes')
      setLoading(false)
    }
  }

  const applyPromoCode = async () => {
    try {
      setApplyingCode(true)
      const promoCodeQuery = query(
        collection(db, 'promoCodes'),
        where('code', '==', newCode.toUpperCase())
      )
      const snapshot = await getDocs(promoCodeQuery)
      
      if (snapshot.empty) {
        setError('Invalid promo code')
        return
      }

      const promoCode = snapshot.docs[0].data() as PromoCode
      
      if (promoCode.currentUses >= promoCode.maxUses) {
        setError('This promo code has reached its usage limit')
        return
      }

      if (new Date(promoCode.validUntil) < new Date()) {
        setError('This promo code has expired')
        return
      }

      // Apply the promo code
      await updateDoc(doc(db, 'promoCodes', promoCode.id), {
        currentUses: promoCode.currentUses + 1
      })

      setNewCode('')
      setError('')
      loadPromoCodes()
    } catch (err) {
      console.error('Error applying promo code:', err)
      setError('Failed to apply promo code')
    } finally {
      setApplyingCode(false)
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
      {/* Apply Promo Code */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Apply Promo Code</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Enter promo code"
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          <button
            onClick={applyPromoCode}
            disabled={applyingCode || !newCode}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {applyingCode ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Promo Codes List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Promo Codes</h2>
          <div className="space-y-4">
            {promoCodes.map(code => (
              <div key={code.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{code.code}</h3>
                    <p className="text-sm text-gray-500">
                      {code.type === 'percentage' ? `${code.discount}% off` : `$${code.discount} off`} • 
                      Min purchase: ${code.minPurchase} • 
                      Uses: {code.currentUses}/{code.maxUses}
                    </p>
                    <p className="text-sm text-gray-500">
                      Valid until: {new Date(code.validUntil).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {promoCodes.length === 0 && (
              <p className="text-center text-gray-500 py-8">No promo codes found</p>
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
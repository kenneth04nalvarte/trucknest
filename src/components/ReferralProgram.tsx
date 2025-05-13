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
  getDoc,
  updateDoc
} from 'firebase/firestore'

interface ReferralStats {
  totalReferrals: number
  earnedRewards: number
  pendingRewards: number
}

interface Referral {
  id: string
  referrerId: string
  refereeId: string
  status: 'pending' | 'completed'
  rewardAmount: number
  createdAt: string
}

export default function ReferralProgram() {
  const { user } = useAuth()
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    earnedRewards: 0,
    pendingRewards: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState('')

  useEffect(() => {
    if (user) {
      loadReferralData()
    }
  }, [user])

  const loadReferralData = async () => {
    try {
      // Generate referral code if not exists
      const userRef = doc(db, 'users', user?.uid || '')
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        setError('User not found')
        return
      }

      const userData = userDoc.data()
      if (!userData.referralCode) {
        const newCode = generateReferralCode()
        await updateDoc(userRef, { referralCode: newCode })
        setReferralCode(newCode)
      } else {
        setReferralCode(userData.referralCode)
      }

      // Get referral stats
      const referralsQuery = query(
        collection(db, 'referrals'),
        where('referrerId', '==', user?.uid)
      )
      const snapshot = await getDocs(referralsQuery)
      
      const stats: ReferralStats = {
        totalReferrals: 0,
        earnedRewards: 0,
        pendingRewards: 0
      }

      snapshot.forEach(doc => {
        const referral = doc.data() as Referral
        stats.totalReferrals++
        if (referral.status === 'completed') {
          stats.earnedRewards += referral.rewardAmount
        } else {
          stats.pendingRewards += referral.rewardAmount
        }
      })

      setReferralStats(stats)
      setLoading(false)
    } catch (err) {
      console.error('Error loading referral data:', err)
      setError('Failed to load referral data')
      setLoading(false)
    }
  }

  const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const shareReferralLink = (platform: 'whatsapp' | 'facebook' | 'twitter') => {
    const link = `${window.location.origin}/signup?ref=${referralCode}`
    const message = `Join TruckNest using my referral code: ${referralCode}`
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message + ' ' + link)}`)
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`)
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(link)}`)
        break
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
      {/* Referral Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Total Referrals</p>
          <h3 className="text-lg font-semibold text-blue-800">{referralStats.totalReferrals}</h3>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Earned Rewards</p>
          <h3 className="text-lg font-semibold text-green-800">${referralStats.earnedRewards}</h3>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Pending Rewards</p>
          <h3 className="text-lg font-semibold text-yellow-800">${referralStats.pendingRewards}</h3>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Referral Code</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={referralCode}
              readOnly
              className="w-full px-4 py-2 border rounded-md bg-gray-50"
            />
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(referralCode)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Share Your Code</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => shareReferralLink('whatsapp')}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            WhatsApp
          </button>
          <button
            onClick={() => shareReferralLink('facebook')}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Facebook
          </button>
          <button
            onClick={() => shareReferralLink('twitter')}
            className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
          >
            Twitter
          </button>
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
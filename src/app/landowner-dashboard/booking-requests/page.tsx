'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import ProtectedRoute from 'src/app/components/ProtectedRoute'
import DashboardLayout from 'src/app/components/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'

const sidebarLinks = [
  { href: '/landowner-dashboard/properties', label: 'My Properties' },
  { href: '/landowner-dashboard/booking-requests', label: 'Booking Requests' },
  { href: '/landowner-dashboard/earnings', label: 'Earnings' },
  { href: '/landowner-dashboard/profile', label: 'Profile' },
]

export default function BookingRequests() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)

  useEffect(() => {
    if (!user) return
    const fetchBookings = async () => {
      const q = query(collection(db, 'bookings'), where('ownerId', '==', user.uid))
      const snapshot = await getDocs(q)
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }
    fetchBookings()
  }, [user])

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'bookings', id), { status })
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    setSelected((s: any) => s && s.id === id ? { ...s, status } : s)
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Booking Requests"
        sidebarLinks={sidebarLinks}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4 text-navy">Booking Requests</h1>
          <div className="bg-white rounded shadow p-4">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>Trucker</th>
                  <th>Property</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="border-t">
                    <td>{b.truckerName || b.userId}</td>
                    <td>{b.propertyName || b.propertyId}</td>
                    <td>{b.startDate?.toDate?.().toLocaleDateString?.() || ''} - {b.endDate?.toDate?.().toLocaleDateString?.() || ''}</td>
                    <td>{b.status}</td>
                    <td>
                      <button className="text-blue-600 mr-2" onClick={() => setSelected(b)}>Details</button>
                      {b.status === 'pending' && (
                        <>
                          <button className="text-green-600 mr-2" onClick={() => updateStatus(b.id, 'approved')}>Approve</button>
                          <button className="text-red-600" onClick={() => updateStatus(b.id, 'rejected')}>Reject</button>
                        </>
                      )}
                      {b.status === 'approved' && (
                        <button className="text-orange-600" onClick={() => updateStatus(b.id, 'cancelled')}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Booking Details Modal */}
          {selected && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-2">Booking Details</h2>
                <div className="mb-2">Trucker: {selected.truckerName || selected.userId}</div>
                <div className="mb-2">Property: {selected.propertyName || selected.propertyId}</div>
                <div className="mb-2">Dates: {selected.startDate?.toDate?.().toLocaleDateString?.() || ''} - {selected.endDate?.toDate?.().toLocaleDateString?.() || ''}</div>
                <div className="mb-2">Status: {selected.status}</div>
                <div className="mb-2">Total Price: ${selected.totalPrice}</div>
                <div className="mb-2">Notes: {selected.notes || 'None'}</div>
                <div className="flex justify-end gap-2 mt-4">
                  <button className="px-4 py-2 text-darkgray" onClick={() => setSelected(null)}>Close</button>
                  {selected.status === 'pending' && (
                    <>
                      <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => updateStatus(selected.id, 'approved')}>Approve</button>
                      <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={() => updateStatus(selected.id, 'rejected')}>Reject</button>
                    </>
                  )}
                  {selected.status === 'approved' && (
                    <button className="bg-orange-600 text-white px-4 py-2 rounded" onClick={() => updateStatus(selected.id, 'cancelled')}>Cancel</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
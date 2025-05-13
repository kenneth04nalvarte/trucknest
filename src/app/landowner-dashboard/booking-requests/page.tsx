'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

const sidebarLinks = [
  { href: '/landowner-dashboard/properties', label: 'My Properties' },
  { href: '/landowner-dashboard/booking-requests', label: 'Booking Requests' },
  { href: '/landowner-dashboard/earnings', label: 'Earnings' },
  { href: '/landowner-dashboard/profile', label: 'Profile' },
]

export default function BookingRequests() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all') // all, pending, active, completed

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Booking Requests"
        sidebarLinks={sidebarLinks}
      >
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-navy">Booking Requests</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded font-semibold ${
                  filter === 'all'
                    ? 'bg-navy text-white'
                    : 'bg-lightgray text-darkgray hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded font-semibold ${
                  filter === 'pending'
                    ? 'bg-orange text-white'
                    : 'bg-lightgray text-darkgray hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded font-semibold ${
                  filter === 'active'
                    ? 'bg-green text-white'
                    : 'bg-lightgray text-darkgray hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded font-semibold ${
                  filter === 'completed'
                    ? 'bg-darkgray text-white'
                    : 'bg-lightgray text-darkgray hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Sample Booking Request */}
            <div className="border border-lightgray rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-navy">John Doe</h3>
                  <p className="text-darkgray">Truck #12345</p>
                </div>
                <span className="bg-orange text-white px-3 py-1 rounded-full text-sm">
                  Pending
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-darkgray">Property</p>
                  <p className="font-semibold">123 Main St, City, State</p>
                </div>
                <div>
                  <p className="text-sm text-darkgray">Duration</p>
                  <p className="font-semibold">2 days</p>
                </div>
                <div>
                  <p className="text-sm text-darkgray">Start Date</p>
                  <p className="font-semibold">Mar 15, 2024</p>
                </div>
                <div>
                  <p className="text-sm text-darkgray">Total Amount</p>
                  <p className="font-semibold text-green">$120.00</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold">
                  Reject
                </button>
                <button className="bg-green hover:bg-green-dark text-white px-4 py-2 rounded font-semibold">
                  Accept
                </button>
              </div>
            </div>

            {/* No Requests Message */}
            <div className="text-center py-8 text-darkgray">
              <p className="text-lg mb-2">No booking requests found</p>
              <p className="text-sm">When you receive booking requests, they will appear here</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
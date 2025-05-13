'use client'

import ProtectedRoute from '../../../components/ProtectedRoute'
import DashboardLayout from '../../../components/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const sidebarLinks = [
  { href: '/landowner-dashboard/properties', label: 'My Properties' },
  { href: '/landowner-dashboard/booking-requests', label: 'Booking Requests' },
  { href: '/landowner-dashboard/earnings', label: 'Earnings' },
  { href: '/landowner-dashboard/profile', label: 'Profile' },
]

export default function PendingRequests() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedProperty, setSelectedProperty] = useState('')
  const [filter, setFilter] = useState('all') // all, pending, approved, rejected

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Pending Requests"
        sidebarLinks={sidebarLinks}
      >
        <div className="bg-white shadow rounded-lg p-6">
          {/* Property Selection and Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-darkgray mb-1">
                Select Property
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
              >
                <option value="">All Properties</option>
                <option value="1">123 Main St, City, State</option>
                <option value="2">456 Park Ave, City, State</option>
              </select>
            </div>
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
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded font-semibold ${
                  filter === 'approved'
                    ? 'bg-green text-white'
                    : 'bg-lightgray text-darkgray hover:bg-gray-200'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded font-semibold ${
                  filter === 'rejected'
                    ? 'bg-red-500 text-white'
                    : 'bg-lightgray text-darkgray hover:bg-gray-200'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {/* Sample Request */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  Approve
                </button>
              </div>
            </div>

            {/* No Requests Message */}
            <div className="text-center py-8 text-darkgray">
              <p className="text-lg mb-2">No pending requests found</p>
              <p className="text-sm">When you receive booking requests, they will appear here</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
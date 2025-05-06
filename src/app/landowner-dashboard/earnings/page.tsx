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

export default function Earnings() {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState('month') // week, month, year

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Earnings"
        sidebarLinks={sidebarLinks}
      >
        <div className="space-y-6">
          {/* Earnings Overview */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-navy">Earnings Overview</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeRange('week')}
                  className={`px-4 py-2 rounded font-semibold ${
                    timeRange === 'week'
                      ? 'bg-navy text-white'
                      : 'bg-lightgray text-darkgray hover:bg-gray-200'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setTimeRange('month')}
                  className={`px-4 py-2 rounded font-semibold ${
                    timeRange === 'month'
                      ? 'bg-navy text-white'
                      : 'bg-lightgray text-darkgray hover:bg-gray-200'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setTimeRange('year')}
                  className={`px-4 py-2 rounded font-semibold ${
                    timeRange === 'year'
                      ? 'bg-navy text-white'
                      : 'bg-lightgray text-darkgray hover:bg-gray-200'
                  }`}
                >
                  Year
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-lightgray rounded-lg p-4">
                <p className="text-darkgray mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-green">$2,450.00</p>
                <p className="text-sm text-darkgray">+12% from last {timeRange}</p>
              </div>
              <div className="bg-lightgray rounded-lg p-4">
                <p className="text-darkgray mb-1">Active Bookings</p>
                <p className="text-2xl font-bold text-navy">8</p>
                <p className="text-sm text-darkgray">3 pending requests</p>
              </div>
              <div className="bg-lightgray rounded-lg p-4">
                <p className="text-darkgray mb-1">Average Rate</p>
                <p className="text-2xl font-bold text-orange">$25/hour</p>
                <p className="text-sm text-darkgray">+$2 from last {timeRange}</p>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-navy mb-6">Recent Transactions</h2>
            <div className="space-y-4">
              {/* Sample Transaction */}
              <div className="flex justify-between items-center border-b border-lightgray pb-4">
                <div>
                  <h3 className="font-semibold text-navy">Booking #12345</h3>
                  <p className="text-sm text-darkgray">Mar 15, 2024 - Mar 17, 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green">$120.00</p>
                  <p className="text-sm text-darkgray">Completed</p>
                </div>
              </div>

              {/* No Transactions Message */}
              <div className="text-center py-8 text-darkgray">
                <p className="text-lg mb-2">No transactions found</p>
                <p className="text-sm">Your transaction history will appear here</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-navy mb-6">Payment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-navy mb-2">Bank Account</h3>
                <p className="text-darkgray">•••• 1234</p>
                <p className="text-sm text-darkgray">Chase Bank</p>
              </div>
              <div>
                <h3 className="font-semibold text-navy mb-2">Next Payout</h3>
                <p className="text-green font-semibold">$450.00</p>
                <p className="text-sm text-darkgray">Scheduled for Mar 20, 2024</p>
              </div>
            </div>
            <button className="mt-4 text-orange hover:text-orange-dark font-semibold">
              Update Payment Information
            </button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
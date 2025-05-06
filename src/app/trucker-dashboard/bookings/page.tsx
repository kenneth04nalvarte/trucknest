'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

const sidebarLinks = [
  { href: '/trucker-dashboard', label: 'Overview' },
  { href: '/trucker-dashboard/bookings', label: 'My Bookings' },
  { href: '/trucker-dashboard/vehicles', label: 'My Vehicles' },
  { href: '/trucker-dashboard/profile', label: 'Profile' },
]

export default function MyBookings() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all') // all, active, past, upcoming

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="My Bookings"
        sidebarLinks={sidebarLinks}
      >
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-navy">My Bookings</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-navy text-white' : 'bg-lightgray text-darkgray'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded ${filter === 'active' ? 'bg-navy text-white' : 'bg-lightgray text-darkgray'}`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded ${filter === 'upcoming' ? 'bg-navy text-white' : 'bg-lightgray text-darkgray'}`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`px-4 py-2 rounded ${filter === 'past' ? 'bg-navy text-white' : 'bg-lightgray text-darkgray'}`}
              >
                Past
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Placeholder for bookings list */}
            <div className="border border-lightgray rounded-lg p-4">
              <p className="text-darkgray">No bookings found. Start by booking a parking spot!</p>
              <a href="/booking" className="inline-block mt-2 text-orange hover:text-orange-dark font-semibold">
                Book New Parking
              </a>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
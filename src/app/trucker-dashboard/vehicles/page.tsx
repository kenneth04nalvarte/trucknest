'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import Link from 'next/link'

const sidebarLinks = [
  { href: '/trucker-dashboard', label: 'Overview' },
  { href: '/trucker-dashboard/bookings', label: 'My Bookings' },
  { href: '/trucker-dashboard/vehicles', label: 'My Vehicles' },
  { href: '/trucker-dashboard/profile', label: 'Profile' },
]

export default function MyVehicles() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="My Vehicles"
        sidebarLinks={sidebarLinks}
      >
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-navy">My Vehicles</h2>
            <Link
              href="/trucker-dashboard/vehicles/add"
              className="bg-orange hover:bg-orange-dark text-white px-4 py-2 rounded font-semibold"
            >
              Add New Vehicle
            </Link>
          </div>

          <div className="space-y-4">
            {/* Placeholder for vehicles list */}
            <div className="border border-lightgray rounded-lg p-4">
              <p className="text-darkgray">No vehicles added yet. Add your first vehicle!</p>
              <Link
                href="/trucker-dashboard/vehicles/add"
                className="inline-block mt-2 text-orange hover:text-orange-dark font-semibold"
              >
                Add New Vehicle
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
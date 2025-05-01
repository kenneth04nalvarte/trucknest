'use client'

import ProtectedRoute from '../components/ProtectedRoute'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'

const sidebarLinks = [
  { href: '/trucker-dashboard', label: 'Overview' },
  { href: '/trucker-dashboard/bookings', label: 'My Bookings' },
  { href: '/trucker-dashboard/vehicles', label: 'My Vehicles' },
  { href: '/trucker-dashboard/profile', label: 'Profile' },
]

export default function TruckerDashboard() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Trucker Dashboard"
        sidebarLinks={sidebarLinks}
      >
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome back, {user?.email}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Quick Actions</h3>
              <ul className="space-y-2">
                <li>
                  <button className="text-blue-600 hover:text-blue-800">
                    Book New Parking
                  </button>
                </li>
                <li>
                  <button className="text-blue-600 hover:text-blue-800">
                    View Active Bookings
                  </button>
                </li>
                <li>
                  <button className="text-blue-600 hover:text-blue-800">
                    Add New Vehicle
                  </button>
                </li>
              </ul>
            </div>

            {/* Recent Activity */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">Recent Activity</h3>
              <p className="text-green-600">No recent activity</p>
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-2">Upcoming Bookings</h3>
              <p className="text-purple-600">No upcoming bookings</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
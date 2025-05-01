'use client'

import ProtectedRoute from '../components/ProtectedRoute'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'

const sidebarLinks = [
  { href: '/landowner-dashboard', label: 'Overview' },
  { href: '/landowner-dashboard/properties', label: 'My Properties' },
  { href: '/landowner-dashboard/bookings', label: 'Booking Requests' },
  { href: '/landowner-dashboard/earnings', label: 'Earnings' },
  { href: '/landowner-dashboard/profile', label: 'Profile' },
]

export default function LandownerDashboard() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Property Owner Dashboard"
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
                    List New Property
                  </button>
                </li>
                <li>
                  <button className="text-blue-600 hover:text-blue-800">
                    View Pending Requests
                  </button>
                </li>
                <li>
                  <button className="text-blue-600 hover:text-blue-800">
                    Update Availability
                  </button>
                </li>
              </ul>
            </div>

            {/* Property Stats */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">Property Stats</h3>
              <div className="space-y-2">
                <p className="text-green-600">Active Properties: 0</p>
                <p className="text-green-600">Total Bookings: 0</p>
                <p className="text-green-600">Available Spots: 0</p>
              </div>
            </div>

            {/* Recent Earnings */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-2">Recent Earnings</h3>
              <div className="space-y-2">
                <p className="text-purple-600">This Month: $0</p>
                <p className="text-purple-600">Last Month: $0</p>
                <p className="text-purple-600">Total Earnings: $0</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
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
          <h2 className="text-2xl font-bold mb-6 text-navy">Welcome, {user?.email}!</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="bg-orange/10 p-4 rounded-lg">
              <h3 className="font-medium text-orange mb-2">Quick Actions</h3>
              <ul className="space-y-2">
                <li><button className="text-navy hover:text-orange font-semibold">List New Property</button></li>
                <li><button className="text-navy hover:text-orange font-semibold">View Pending Requests</button></li>
                <li><button className="text-navy hover:text-orange font-semibold">Update Availability</button></li>
              </ul>
            </div>

            {/* Property Stats */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green mb-2">Property Stats</h3>
              <div className="space-y-2">
                <p className="text-darkgray">Active Properties: 0</p>
                <p className="text-darkgray">Total Bookings: 0</p>
                <p className="text-darkgray">Available Spots: 0</p>
              </div>
            </div>

            {/* Recent Earnings */}
            <div className="bg-lightgray p-4 rounded-lg">
              <h3 className="font-medium text-darkgray mb-2">Recent Earnings</h3>
              <div className="space-y-2">
                <p className="text-darkgray">This Month: $0</p>
                <p className="text-darkgray">Last Month: $0</p>
                <p className="text-darkgray">Total Earnings: $0</p>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-navy text-white p-4 rounded-lg col-span-1 md:col-span-2 lg:col-span-3">
              <h3 className="font-medium text-orange mb-2">Tips to Attract More Bookings</h3>
              <ul className="list-disc pl-5">
                <li>Add high-quality photos of your property</li>
                <li>Keep your availability up to date</li>
                <li>Respond quickly to booking requests</li>
                <li>Offer competitive pricing</li>
              </ul>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
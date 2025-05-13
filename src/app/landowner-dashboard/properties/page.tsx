'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import Link from 'next/link'

const sidebarLinks = [
  { href: '/landowner-dashboard/properties', label: 'My Properties' },
  { href: '/landowner-dashboard/booking-requests', label: 'Booking Requests' },
  { href: '/landowner-dashboard/earnings', label: 'Earnings' },
  { href: '/landowner-dashboard/profile', label: 'Profile' },
]

export default function MyProperties() {
  const { user } = useAuth()
  // Placeholder for profile photo; replace with real photo URL if available
  const profilePhoto = null // e.g., user?.profilePhoto

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="My Properties"
        sidebarLinks={sidebarLinks}
      >
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-navy">My Properties</h2>
            <Link
              href="/landowner-dashboard/properties/add"
              className="bg-orange hover:bg-orange-dark text-white px-4 py-2 rounded font-semibold"
            >
              List New Property
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Property Card */}
            <div className="border border-lightgray rounded-lg p-4">
              <div className="aspect-w-16 aspect-h-9 mb-4 bg-lightgray rounded-lg"></div>
              <h3 className="text-lg font-semibold text-navy mb-2">Sample Property</h3>
              <p className="text-darkgray mb-2">123 Main St, City, State</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-green font-semibold">$25/hour</span>
                <span className="text-darkgray">5 spots available</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-lightgray text-darkgray px-2 py-1 rounded-full text-sm">24/7 Security</span>
                <span className="bg-lightgray text-darkgray px-2 py-1 rounded-full text-sm">Restrooms</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-lightgray flex items-center justify-center overflow-hidden border border-navy">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-lg text-navy">👤</span>
                  )}
                </div>
                <span className="text-sm text-darkgray">Listed by <span className="font-semibold">{user?.displayName || 'Landmember'}</span></span>
              </div>
              <div className="flex justify-between">
                <Link
                  href="/landowner-dashboard/properties/update-availability"
                  className="text-orange hover:text-orange-dark font-semibold"
                >
                  Update Availability
                </Link>
                <Link
                  href="/landowner-dashboard/properties/pending-requests"
                  className="text-navy hover:text-navy-dark font-semibold"
                >
                  View Requests
                </Link>
              </div>
            </div>

            {/* Add New Property Card */}
            <div className="border-2 border-dashed border-lightgray rounded-lg p-4 flex flex-col items-center justify-center min-h-[300px]">
              <div className="text-4xl text-lightgray mb-2">+</div>
              <h3 className="text-lg font-semibold text-navy mb-2">Add New Property</h3>
              <p className="text-darkgray text-center mb-4">
                List your property and start earning from truck parking
              </p>
              <Link
                href="/landowner-dashboard/properties/add"
                className="bg-orange hover:bg-orange-dark text-white px-4 py-2 rounded font-semibold"
              >
                List New Property
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
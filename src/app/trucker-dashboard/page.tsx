'use client'

import ProtectedRoute from '../components/ProtectedRoute'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import Link from 'next/link'

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
          <h2 className="text-2xl font-bold mb-6 text-navy">Welcome, {user?.email}!</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="bg-orange/10 p-4 rounded-lg">
              <h3 className="font-medium text-orange mb-2">Quick Actions</h3>
              <ul className="space-y-2">
                <li><Link href="/booking" className="text-navy hover:text-orange font-semibold">Book New Parking</Link></li>
                <li><Link href="/trucker-dashboard/bookings" className="text-navy hover:text-orange font-semibold">View Active Bookings</Link></li>
                <li><Link href="/trucker-dashboard/vehicles/add" className="text-navy hover:text-orange font-semibold">Add New Vehicle</Link></li>
              </ul>
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green mb-2">Upcoming Bookings</h3>
              <p className="text-darkgray">No upcoming bookings</p>
              <Link href="/trucker-dashboard/bookings" className="text-orange font-semibold hover:underline mt-2 inline-block">View All Bookings</Link>
            </div>

            {/* Recent Activity */}
            <div className="bg-lightgray p-4 rounded-lg">
              <h3 className="font-medium text-darkgray mb-2">Recent Activity</h3>
              <p className="text-darkgray">No recent activity</p>
            </div>

            {/* Referral Program */}
            <div className="bg-navy text-white p-4 rounded-lg col-span-1 md:col-span-2 lg:col-span-3">
              <h3 className="font-medium text-orange mb-2">Refer & Earn</h3>
              <p>Invite friends and earn rewards when they book parking with TruckNest!</p>
              <button className="mt-3 bg-orange hover:bg-orange-dark text-white px-4 py-2 rounded font-semibold">Share Referral Link</button>
            </div>
          </div>

          {/* My Bookings Section */}
          <div className="mt-10 bg-white border border-lightgray rounded-lg p-6">
            <h3 className="text-xl font-semibold text-navy mb-4">My Bookings</h3>
            <p className="text-darkgray mb-2">You have no bookings yet.</p>
            <Link href="/trucker-dashboard/bookings" className="bg-orange hover:bg-orange-dark text-white px-4 py-2 rounded font-semibold">Go to My Bookings</Link>
          </div>

          {/* My Vehicles Section */}
          <div className="mt-10 bg-white border border-lightgray rounded-lg p-6">
            <h3 className="text-xl font-semibold text-navy mb-4">My Vehicles</h3>
            <p className="text-darkgray mb-2">You have not added any vehicles yet.</p>
            <Link href="/trucker-dashboard/vehicles" className="bg-orange hover:bg-orange-dark text-white px-4 py-2 rounded font-semibold">Go to My Vehicles</Link>
          </div>

          {/* Profile Section */}
          <div className="mt-10 bg-white border border-lightgray rounded-lg p-6">
            <h3 className="text-xl font-semibold text-navy mb-4">Profile</h3>
            <p className="text-darkgray mb-2">View and update your profile information.</p>
            <Link href="/trucker-dashboard/profile" className="bg-orange hover:bg-orange-dark text-white px-4 py-2 rounded font-semibold">Go to Profile</Link>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
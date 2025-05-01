'use client'

import ProtectedRoute from '../components/ProtectedRoute'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'

const sidebarLinks = [
  { href: '/admin-dashboard', label: 'Overview' },
  { href: '/admin-dashboard/verifications', label: 'Verifications' },
  { href: '/admin-dashboard/users', label: 'User Management' },
  { href: '/admin-dashboard/properties', label: 'Property Management' },
  { href: '/admin-dashboard/reports', label: 'Reports' },
  { href: '/admin-dashboard/settings', label: 'Settings' },
]

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Admin Dashboard"
        sidebarLinks={sidebarLinks}
      >
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Admin Control Panel</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Verification Queue */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Verification Queue</h3>
              <div className="space-y-2">
                <p className="text-blue-600">Pending Verifications: 0</p>
                <p className="text-blue-600">Completed Today: 0</p>
                <button className="mt-2 text-blue-600 hover:text-blue-800">
                  View Queue
                </button>
              </div>
            </div>

            {/* User Statistics */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">User Statistics</h3>
              <div className="space-y-2">
                <p className="text-green-600">Total Users: 0</p>
                <p className="text-green-600">Active Property Owners: 0</p>
                <p className="text-green-600">Active Truckers: 0</p>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-2">System Status</h3>
              <div className="space-y-2">
                <p className="text-purple-600">System Status: Online</p>
                <p className="text-purple-600">Last Backup: Never</p>
                <p className="text-purple-600">Active Sessions: 1</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">Recent Activity</h3>
              <p className="text-yellow-600">No recent activity</p>
            </div>

            {/* Support Tickets */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">Support Tickets</h3>
              <div className="space-y-2">
                <p className="text-red-600">Open Tickets: 0</p>
                <p className="text-red-600">Urgent Tickets: 0</p>
                <button className="mt-2 text-red-600 hover:text-red-800">
                  View Tickets
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-medium text-indigo-800 mb-2">Quick Actions</h3>
              <ul className="space-y-2">
                <li>
                  <button className="text-indigo-600 hover:text-indigo-800">
                    Send System Alert
                  </button>
                </li>
                <li>
                  <button className="text-indigo-600 hover:text-indigo-800">
                    Generate Reports
                  </button>
                </li>
                <li>
                  <button className="text-indigo-600 hover:text-indigo-800">
                    System Backup
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
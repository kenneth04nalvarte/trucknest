'use client'

import ProtectedRoute from '../components/ProtectedRoute'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import Link from 'next/link'

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
      <div className="flex min-h-screen bg-lightgray">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-lg p-6 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-navy mb-6">Admin Dashboard</h2>
          <nav className="flex flex-col gap-2">
            <Link href="/admin-dashboard/verifications" className="px-4 py-2 rounded hover:bg-orange/10 font-semibold text-navy">Verifications</Link>
            <Link href="/admin-dashboard/user-management" className="px-4 py-2 rounded hover:bg-orange/10 font-semibold text-navy">User Management</Link>
            <Link href="/admin-dashboard/property-management" className="px-4 py-2 rounded hover:bg-orange/10 font-semibold text-navy">Property Management</Link>
            <Link href="/admin-dashboard/reports" className="px-4 py-2 rounded hover:bg-orange/10 font-semibold text-navy">Reports</Link>
            <Link href="/admin-dashboard/settings" className="px-4 py-2 rounded hover:bg-orange/10 font-semibold text-navy">Settings</Link>
          </nav>
        </aside>
        {/* Main Content */}
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-navy mb-6">Welcome, Admin!</h1>
          <p className="text-darkgray mb-4">Select a section from the left to manage the platform.</p>
          {/* You can add dashboard stats or quick links here */}
        </main>
      </div>
    </ProtectedRoute>
  )
} 
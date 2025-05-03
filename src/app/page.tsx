'use client'

import Link from 'next/link'
import { useAuth } from './context/AuthContext'

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Welcome to TruckNest Parking</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Find Parking</h2>
          <p className="text-gray-600 mb-4">
            Search for available parking spots near you or along your route.
          </p>
          <Link 
            href="/search" 
            className="btn-primary inline-block"
          >
            Search Spots
          </Link>
        </div>

        {user && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">My Dashboard</h2>
            <p className="text-gray-600 mb-4">
              View your bookings, saved spots, and account settings.
            </p>
            <Link 
              href="/dashboard" 
              className="btn-primary inline-block"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {!user && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Get Started</h2>
            <p className="text-gray-600 mb-4">
              Create an account or sign in to book parking spots.
            </p>
            <Link 
              href="/auth/signin" 
              className="btn-primary inline-block"
            >
              Sign In
            </Link>
          </div>
        )}

        {user && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Admin Analytics</h2>
            <p className="text-gray-600 mb-4">
              View detailed analytics and manage the platform.
            </p>
            <Link 
              href="/admin/analytics" 
              className="btn-primary inline-block"
            >
              View Analytics
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import AdminDashboardLayout from '../layout'

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('bookings')

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">Reports</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex gap-4 mb-6">
            <button
              className={`px-4 py-2 rounded ${
                selectedReport === 'bookings'
                  ? 'bg-navy text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setSelectedReport('bookings')}
            >
              Booking Reports
            </button>
            <button
              className={`px-4 py-2 rounded ${
                selectedReport === 'revenue'
                  ? 'bg-navy text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setSelectedReport('revenue')}
            >
              Revenue Reports
            </button>
            <button
              className={`px-4 py-2 rounded ${
                selectedReport === 'users'
                  ? 'bg-navy text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setSelectedReport('users')}
            >
              User Reports
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            {selectedReport === 'bookings' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Booking Reports</h2>
                <p>Generate and view booking reports here.</p>
              </div>
            )}
            {selectedReport === 'revenue' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Revenue Reports</h2>
                <p>Generate and view revenue reports here.</p>
              </div>
            )}
            {selectedReport === 'users' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">User Reports</h2>
                <p>Generate and view user reports here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  )
} 
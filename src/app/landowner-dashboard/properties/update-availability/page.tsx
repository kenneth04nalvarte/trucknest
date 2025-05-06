'use client'

import ProtectedRoute from '../../../components/ProtectedRoute'
import DashboardLayout from '../../../components/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const sidebarLinks = [
  { href: '/landowner-dashboard/properties', label: 'My Properties' },
  { href: '/landowner-dashboard/booking-requests', label: 'Booking Requests' },
  { href: '/landowner-dashboard/earnings', label: 'Earnings' },
  { href: '/landowner-dashboard/profile', label: 'Profile' },
]

export default function UpdateAvailability() {
  const { user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    propertyId: '',
    startDate: '',
    endDate: '',
    availableSpots: '',
    isAvailable: true,
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement availability update logic
    router.push('/landowner-dashboard/properties')
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Update Availability"
        sidebarLinks={sidebarLinks}
      >
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Selection */}
            <div>
              <h2 className="text-xl font-bold text-navy mb-4">Select Property</h2>
              <div>
                <label className="block text-sm font-medium text-darkgray mb-1">
                  Property
                </label>
                <select
                  name="propertyId"
                  value={formData.propertyId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                >
                  <option value="">Select a property</option>
                  <option value="1">123 Main St, City, State</option>
                  <option value="2">456 Park Ave, City, State</option>
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <h2 className="text-xl font-bold text-navy mb-4">Date Range</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
              </div>
            </div>

            {/* Availability Settings */}
            <div>
              <h2 className="text-xl font-bold text-navy mb-4">Availability Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Available Spots
                  </label>
                  <input
                    type="number"
                    name="availableSpots"
                    value={formData.availableSpots}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                      className="rounded text-orange focus:ring-orange"
                    />
                    <span className="text-darkgray">Property is available for booking</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                    placeholder="Add any special instructions or notes about availability..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-lightgray rounded font-semibold text-darkgray hover:bg-lightgray"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-orange hover:bg-orange-dark text-white px-6 py-2 rounded font-semibold"
              >
                Update Availability
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
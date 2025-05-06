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

interface FormData {
  propertyId: string
  startDate: string
  endDate: string
  availabilityType: 'available' | 'unavailable'
  notes: string
}

export default function UpdateAvailability() {
  const { user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    propertyId: '',
    startDate: '',
    endDate: '',
    availabilityType: 'available',
    notes: ''
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement update availability logic
    router.push('/landowner-dashboard/properties')
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Update Availability"
        sidebarLinks={sidebarLinks}
      >
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-navy mb-6">Update Property Availability</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="propertyId" className="block text-sm font-medium text-darkgray mb-2">
                Select Property
              </label>
              <select
                id="propertyId"
                name="propertyId"
                value={formData.propertyId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
              >
                <option value="">Select a property</option>
                <option value="property1">Property 1</option>
                <option value="property2">Property 2</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-darkgray mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-darkgray mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                />
              </div>
            </div>

            <div>
              <label htmlFor="availabilityType" className="block text-sm font-medium text-darkgray mb-2">
                Availability Status
              </label>
              <select
                id="availabilityType"
                name="availabilityType"
                value={formData.availabilityType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-darkgray mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                placeholder="Add any additional notes or instructions..."
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-darkgray hover:text-navy transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-orange hover:bg-orange-dark text-white rounded-md transition-colors"
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
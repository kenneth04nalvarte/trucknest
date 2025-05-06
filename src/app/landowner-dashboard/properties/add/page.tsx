'use client'

import ProtectedRoute from '../../../components/ProtectedRoute'
import DashboardLayout from '../../../components/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AddressAutocomplete from '../../../components/AddressAutocomplete'

const sidebarLinks = [
  { href: '/landowner-dashboard/properties', label: 'My Properties' },
  { href: '/landowner-dashboard/booking-requests', label: 'Booking Requests' },
  { href: '/landowner-dashboard/earnings', label: 'Earnings' },
  { href: '/landowner-dashboard/profile', label: 'Profile' },
]

export default function AddProperty() {
  const { user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
    hourlyRate: '',
    dailyRate: '',
    weeklyRate: '',
    monthlyRate: '',
    totalSpots: '',
    amenities: {
      security: false,
      restrooms: false,
      showers: false,
      wifi: false,
      food: false,
      maintenance: false,
    },
    images: [] as File[],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAmenityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [name]: checked
      }
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        images: [...Array.from(e.target.files || [])]
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement property creation logic
    router.push('/landowner-dashboard/properties')
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="List New Property"
        sidebarLinks={sidebarLinks}
      >
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-bold text-navy mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Property Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Address
                  </label>
                  <AddressAutocomplete
                    onAddressSelect={(address, lat, lng) => setFormData(prev => ({ ...prev, address }))}
                    placeholder="Enter address"
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h2 className="text-xl font-bold text-navy mb-4">Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Daily Rate ($)
                  </label>
                  <input
                    type="number"
                    name="dailyRate"
                    value={formData.dailyRate}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Weekly Rate ($)
                  </label>
                  <input
                    type="number"
                    name="weeklyRate"
                    value={formData.weeklyRate}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Monthly Rate ($)
                  </label>
                  <input
                    type="number"
                    name="monthlyRate"
                    value={formData.monthlyRate}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
              </div>
            </div>

            {/* Capacity */}
            <div>
              <h2 className="text-xl font-bold text-navy mb-4">Capacity</h2>
              <div>
                <label className="block text-sm font-medium text-darkgray mb-1">
                  Total Parking Spots
                </label>
                <input
                  type="number"
                  name="totalSpots"
                  value={formData.totalSpots}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-xl font-bold text-navy mb-4">Amenities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="security"
                    checked={formData.amenities.security}
                    onChange={handleAmenityChange}
                    className="rounded text-orange focus:ring-orange"
                  />
                  <span className="text-darkgray">24/7 Security</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="restrooms"
                    checked={formData.amenities.restrooms}
                    onChange={handleAmenityChange}
                    className="rounded text-orange focus:ring-orange"
                  />
                  <span className="text-darkgray">Restrooms</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="showers"
                    checked={formData.amenities.showers}
                    onChange={handleAmenityChange}
                    className="rounded text-orange focus:ring-orange"
                  />
                  <span className="text-darkgray">Showers</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="wifi"
                    checked={formData.amenities.wifi}
                    onChange={handleAmenityChange}
                    className="rounded text-orange focus:ring-orange"
                  />
                  <span className="text-darkgray">WiFi</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="food"
                    checked={formData.amenities.food}
                    onChange={handleAmenityChange}
                    className="rounded text-orange focus:ring-orange"
                  />
                  <span className="text-darkgray">Food Available</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="maintenance"
                    checked={formData.amenities.maintenance}
                    onChange={handleAmenityChange}
                    className="rounded text-orange focus:ring-orange"
                  />
                  <span className="text-darkgray">Maintenance Services</span>
                </label>
              </div>
            </div>

            {/* Images */}
            <div>
              <h2 className="text-xl font-bold text-navy mb-4">Property Images</h2>
              <div>
                <label className="block text-sm font-medium text-darkgray mb-1">
                  Upload Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                />
                <p className="mt-1 text-sm text-darkgray">
                  Upload up to 5 images of your property
                </p>
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
                List Property
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
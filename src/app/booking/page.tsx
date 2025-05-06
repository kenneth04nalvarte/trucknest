'use client'

import ProtectedRoute from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookParking() {
  const { user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    location: '',
    startDate: '',
    endDate: '',
    vehicleType: 'semi-truck',
    duration: '1',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Search for available parking spots
    router.push('/booking/search-results')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-lightgray">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-3xl font-bold text-navy mb-8">Book Parking</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location Search */}
              <div>
                <label className="block text-darkgray mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-lightgray rounded"
                  placeholder="Enter city, state, or zip code"
                />
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-darkgray mb-2">Start Date</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-lightgray rounded"
                  />
                </div>

                <div>
                  <label className="block text-darkgray mb-2">Duration (days)</label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-lightgray rounded"
                  >
                    <option value="1">1 Day</option>
                    <option value="2">2 Days</option>
                    <option value="3">3 Days</option>
                    <option value="7">1 Week</option>
                    <option value="14">2 Weeks</option>
                    <option value="30">1 Month</option>
                  </select>
                </div>
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-darkgray mb-2">Vehicle Type</label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-lightgray rounded"
                >
                  <option value="semi-truck">Semi Truck</option>
                  <option value="box-truck">Box Truck</option>
                  <option value="flatbed">Flatbed</option>
                  <option value="refrigerated">Refrigerated</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-orange hover:bg-orange-dark text-white px-6 py-3 rounded-lg font-semibold text-lg"
                >
                  Search Available Spots
                </button>
              </div>
            </form>

            {/* Additional Information */}
            <div className="mt-8 pt-8 border-t border-lightgray">
              <h2 className="text-xl font-semibold text-navy mb-4">Why Book with TruckNest?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-orange text-2xl mb-2">🔒</div>
                  <h3 className="font-semibold text-darkgray mb-2">Secure Parking</h3>
                  <p className="text-darkgray">24/7 monitored parking spots</p>
                </div>
                <div className="text-center">
                  <div className="text-orange text-2xl mb-2">💰</div>
                  <h3 className="font-semibold text-darkgray mb-2">Best Rates</h3>
                  <p className="text-darkgray">Competitive pricing guaranteed</p>
                </div>
                <div className="text-center">
                  <div className="text-orange text-2xl mb-2">🚚</div>
                  <h3 className="font-semibold text-darkgray mb-2">Truck-Friendly</h3>
                  <p className="text-darkgray">Spaces designed for all truck types</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 
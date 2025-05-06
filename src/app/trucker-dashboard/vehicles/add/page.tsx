'use client'

import ProtectedRoute from '../../../components/ProtectedRoute'
import DashboardLayout from '../../../components/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const sidebarLinks = [
  { href: '/trucker-dashboard', label: 'Overview' },
  { href: '/trucker-dashboard/bookings', label: 'My Bookings' },
  { href: '/trucker-dashboard/vehicles', label: 'My Vehicles' },
  { href: '/trucker-dashboard/profile', label: 'Profile' },
]

export default function AddVehicle() {
  const { user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    vehicleType: 'semi-truck',
    length: '',
    height: '',
    weight: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Add vehicle to Firestore
    router.push('/trucker-dashboard/vehicles')
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
      <DashboardLayout
        title="Add New Vehicle"
        sidebarLinks={sidebarLinks}
      >
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-navy mb-6">Add New Vehicle</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-darkgray mb-2">Make</label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-lightgray rounded"
                  placeholder="e.g., Freightliner"
                />
              </div>

              <div>
                <label className="block text-darkgray mb-2">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-lightgray rounded"
                  placeholder="e.g., Cascadia"
                />
              </div>

              <div>
                <label className="block text-darkgray mb-2">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full p-2 border border-lightgray rounded"
                  placeholder="e.g., 2023"
                />
              </div>

              <div>
                <label className="block text-darkgray mb-2">License Plate</label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-lightgray rounded"
                  placeholder="Enter license plate number"
                />
              </div>

              <div>
                <label className="block text-darkgray mb-2">Vehicle Type</label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-lightgray rounded"
                >
                  <option value="semi-truck">Semi Truck</option>
                  <option value="box-truck">Box Truck</option>
                  <option value="flatbed">Flatbed</option>
                  <option value="refrigerated">Refrigerated</option>
                </select>
              </div>

              <div>
                <label className="block text-darkgray mb-2">Length (feet)</label>
                <input
                  type="number"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full p-2 border border-lightgray rounded"
                  placeholder="e.g., 53"
                />
              </div>

              <div>
                <label className="block text-darkgray mb-2">Height (feet)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full p-2 border border-lightgray rounded"
                  placeholder="e.g., 13.6"
                />
              </div>

              <div>
                <label className="block text-darkgray mb-2">Weight (tons)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full p-2 border border-lightgray rounded"
                  placeholder="e.g., 40"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-navy text-navy rounded font-semibold hover:bg-navy/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-orange hover:bg-orange-dark text-white px-4 py-2 rounded font-semibold"
              >
                Add Vehicle
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
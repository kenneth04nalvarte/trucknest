'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { useState, ChangeEvent } from 'react'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import ConnectWithStripeButton from '@/components/landowner/ConnectWithStripeButton'

const sidebarLinks = [
  { href: '/landowner-dashboard/properties', label: 'My Properties' },
  { href: '/landowner-dashboard/booking-requests', label: 'Booking Requests' },
  { href: '/landowner-dashboard/earnings', label: 'Earnings' },
  { href: '/landowner-dashboard/profile', label: 'Profile' },
]

export default function Profile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: 'John Doe',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    company: 'Doe Properties LLC',
    address: '123 Business St, Suite 100',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
  })
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setProfilePhoto(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setProfilePhoto(null)
    setPhotoFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement profile update logic
    setIsEditing(false)
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Profile"
        sidebarLinks={sidebarLinks}
      >
        <div className="space-y-6">
          {/* Profile Photo Upload */}
          <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center mb-6">
            <div className="mb-4">
              <div className="w-28 h-28 rounded-full bg-lightgray flex items-center justify-center overflow-hidden border-2 border-navy">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-4xl text-navy">👤</span>
                )}
              </div>
            </div>
            {isEditing && (
              <div className="flex flex-col items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange file:text-white hover:file:bg-orange-dark"
                />
                {profilePhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-navy">Personal Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-orange hover:text-orange-dark font-semibold"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-darkgray mb-1">
                    Address
                  </label>
                  {isEditing ? (
                    <AddressAutocomplete
                      value={formData.address}
                      onAddressSelect={address => handleChange({ target: { name: 'address', value: address } } as any)}
                      placeholder="Enter address"
                      className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  ) : (
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  )}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-orange hover:bg-orange-dark text-white px-6 py-2 rounded font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Preferences */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-navy mb-6">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-navy">Email Notifications</h3>
                  <p className="text-sm text-darkgray">Receive email updates about bookings and earnings</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-lightgray peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-lightgray after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-navy">SMS Notifications</h3>
                  <p className="text-sm text-darkgray">Receive text messages for urgent updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-lightgray peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-lightgray after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-navy mb-6">Security</h2>
            <button className="text-orange hover:text-orange-dark font-semibold">
              Change Password
            </button>
          </div>

          <div className="mb-8">
            <ConnectWithStripeButton />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
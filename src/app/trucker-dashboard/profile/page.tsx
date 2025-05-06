'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { useState, ChangeEvent } from 'react'

const sidebarLinks = [
  { href: '/trucker-dashboard', label: 'Overview' },
  { href: '/trucker-dashboard/bookings', label: 'My Bookings' },
  { href: '/trucker-dashboard/vehicles', label: 'My Vehicles' },
  { href: '/trucker-dashboard/profile', label: 'Profile' },
]

export default function Profile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

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

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Profile"
        sidebarLinks={sidebarLinks}
      >
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-navy">Profile Settings</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-navy hover:bg-navy-dark text-white px-4 py-2 rounded font-semibold"
            >
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>

          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center mb-6">
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

          <div className="space-y-6">
            {/* Profile Information */}
            <div className="border border-lightgray rounded-lg p-6">
              <h3 className="text-xl font-semibold text-navy mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-darkgray mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full p-2 border border-lightgray rounded bg-lightgray"
                  />
                </div>
                <div>
                  <label className="block text-darkgray mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    disabled={!isEditing}
                    className="w-full p-2 border border-lightgray rounded"
                  />
                </div>
                <div>
                  <label className="block text-darkgray mb-2">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    disabled={!isEditing}
                    className="w-full p-2 border border-lightgray rounded"
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="border border-lightgray rounded-lg p-6">
              <h3 className="text-xl font-semibold text-navy mb-4">Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifications"
                    className="mr-2"
                    disabled={!isEditing}
                  />
                  <label htmlFor="notifications" className="text-darkgray">
                    Receive email notifications for booking updates
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="marketing"
                    className="mr-2"
                    disabled={!isEditing}
                  />
                  <label htmlFor="marketing" className="text-darkgray">
                    Receive marketing communications
                  </label>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="border border-lightgray rounded-lg p-6">
              <h3 className="text-xl font-semibold text-navy mb-4">Security</h3>
              <button className="bg-orange hover:bg-orange-dark text-white px-4 py-2 rounded font-semibold">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
'use client'

import { useState } from 'react'
import AdminDashboardLayout from '../layout'

type SettingKey = 'notifications' | 'emailAlerts' | 'autoApprove'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    autoApprove: false
  })

  const handleToggle = (setting: SettingKey) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }))
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">Settings</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Notifications</h3>
                <p className="text-gray-600">Receive notifications for important updates</p>
              </div>
              <button
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications ? 'bg-navy' : 'bg-gray-300'
                }`}
                onClick={() => handleToggle('notifications')}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Email Alerts</h3>
                <p className="text-gray-600">Receive email alerts for system updates</p>
              </div>
              <button
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.emailAlerts ? 'bg-navy' : 'bg-gray-300'
                }`}
                onClick={() => handleToggle('emailAlerts')}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                    settings.emailAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Auto-approve Bookings</h3>
                <p className="text-gray-600">Automatically approve booking requests</p>
              </div>
              <button
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.autoApprove ? 'bg-navy' : 'bg-gray-300'
                }`}
                onClick={() => handleToggle('autoApprove')}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                    settings.autoApprove ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  )
} 
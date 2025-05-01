'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/config/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  onSnapshot
} from 'firebase/firestore'

interface NotificationTemplate {
  id: string
  name: string
  type: 'push' | 'sms'
  title?: string
  body: string
  category: 'booking' | 'payment' | 'reminder' | 'system'
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface ScheduledNotification {
  id: string
  templateId: string
  userId: string
  scheduledFor: Timestamp
  status: 'pending' | 'sent' | 'failed'
  createdAt: Timestamp
  updatedAt: Timestamp
}

export default function NotificationManager() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'push' as const,
    title: '',
    body: '',
    category: 'system' as const
  })

  useEffect(() => {
    if (!user) return

    // Subscribe to templates
    const templatesQuery = query(
      collection(db, 'notificationTemplates'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribeTemplates = onSnapshot(templatesQuery, (snapshot) => {
      const templatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationTemplate[]
      setTemplates(templatesData)
    })

    // Subscribe to scheduled notifications
    const notificationsQuery = query(
      collection(db, 'scheduledNotifications'),
      where('status', '==', 'pending'),
      orderBy('scheduledFor', 'asc')
    )

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScheduledNotification[]
      setScheduledNotifications(notificationsData)
    })

    setLoading(false)

    return () => {
      unsubscribeTemplates()
      unsubscribeNotifications()
    }
  }, [user])

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTemplate.name || !newTemplate.body) return

    try {
      await addDoc(collection(db, 'notificationTemplates'), {
        ...newTemplate,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })

      setNewTemplate({
        name: '',
        type: 'push',
        title: '',
        body: '',
        category: 'system'
      })
    } catch (err) {
      console.error('Error creating template:', err)
      setError('Failed to create notification template')
    }
  }

  const handleScheduleNotification = async (templateId: string, userId: string, scheduledFor: Date) => {
    try {
      await addDoc(collection(db, 'scheduledNotifications'), {
        templateId,
        userId,
        scheduledFor: Timestamp.fromDate(scheduledFor),
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    } catch (err) {
      console.error('Error scheduling notification:', err)
      setError('Failed to schedule notification')
    }
  }

  const handleCancelNotification = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'scheduledNotifications', notificationId), {
        status: 'cancelled',
        updatedAt: Timestamp.now()
      })
    } catch (err) {
      console.error('Error cancelling notification:', err)
      setError('Failed to cancel notification')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Templates Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Notification Templates</h2>
          
          {/* Create Template Form */}
          <form onSubmit={handleCreateTemplate} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Template Name</label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                placeholder="Enter template name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={newTemplate.type}
                onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as 'push' | 'sms' })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              >
                <option value="push">Push Notification</option>
                <option value="sms">SMS</option>
              </select>
            </div>

            {newTemplate.type === 'push' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  placeholder="Enter notification title"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Message Body</label>
              <textarea
                value={newTemplate.body}
                onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                rows={3}
                placeholder="Enter message content"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as 'booking' | 'payment' | 'reminder' | 'system' })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              >
                <option value="booking">Booking</option>
                <option value="payment">Payment</option>
                <option value="reminder">Reminder</option>
                <option value="system">System</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!newTemplate.name || !newTemplate.body}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Create Template
            </button>
          </form>
        </div>

        {/* Templates List */}
        <div className="divide-y divide-gray-200">
          {templates.map(template => (
            <div
              key={template.id}
              className="p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.body}</p>
                </div>
                <span className={`
                  px-2 py-1 text-xs rounded-full
                  ${template.type === 'push' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                `}>
                  {template.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Notifications Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Scheduled Notifications</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {scheduledNotifications.map(notification => (
            <div key={notification.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {templates.find(t => t.id === notification.templateId)?.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Scheduled for: {notification.scheduledFor.toDate().toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleCancelNotification(notification.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 
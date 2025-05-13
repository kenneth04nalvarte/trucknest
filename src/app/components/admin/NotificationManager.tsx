'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/app/config/firebase'
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
  onSnapshot,
  deleteDoc
} from 'firebase/firestore'

interface NotificationTemplate {
  id: string
  type: 'push' | 'sms'
  title: string
  body: string
  trigger: string
  name: string
  category: 'booking' | 'payment' | 'reminder' | 'system'
  createdAt: Timestamp
  updatedAt: Timestamp
}

type NewTemplate = Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>

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
  const [newTemplate, setNewTemplate] = useState<NewTemplate>({
    type: 'push',
    title: '',
    body: '',
    trigger: '',
    name: '',
    category: 'system',
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

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addDoc(collection(db, 'notificationTemplates'), {
        ...newTemplate,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      setNewTemplate({
        type: 'push',
        title: '',
        body: '',
        trigger: '',
        name: '',
        category: 'system',
      })
      fetchTemplates()
    } catch (error) {
      console.error('Error adding template:', error)
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

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteDoc(doc(db, 'notificationTemplates', templateId))
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const templatesRef = collection(db, 'notificationTemplates')
      const snapshot = await getDocs(templatesRef)
      
      const templatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationTemplate[]
      
      setTemplates(templatesData)
    } catch (error) {
      console.error('Error fetching templates:', error)
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Notification Templates</h1>

      <form onSubmit={handleAddTemplate} className="mb-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={newTemplate.type}
            onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as NotificationTemplate['type'] })}
            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
          >
            <option value="push">Push Notification</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={newTemplate.title}
            onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Body</label>
          <textarea
            value={newTemplate.body}
            onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={newTemplate.category}
            onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as NotificationTemplate['category'] })}
            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
          >
            <option value="booking">Booking</option>
            <option value="payment">Payment</option>
            <option value="reminder">Reminder</option>
            <option value="system">System</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Trigger</label>
          <input
            type="text"
            value={newTemplate.trigger}
            onChange={(e) => setNewTemplate({ ...newTemplate, trigger: e.target.value })}
            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Template
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mb-2">
                  {template.type}
                </span>
                <h3 className="text-lg font-semibold">{template.name}</h3>
                <p className="text-gray-600 mt-1">{template.body}</p>
                <p className="text-sm text-gray-500 mt-2">Category: {template.category}</p>
                <p className="text-sm text-gray-500">Trigger: {template.trigger}</p>
              </div>
              <button
                onClick={() => handleDeleteTemplate(template.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 
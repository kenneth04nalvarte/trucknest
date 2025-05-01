import admin from 'firebase-admin'
import twilio from 'twilio'
import { db } from '@/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore'

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

class NotificationService {
  private static instance: NotificationService
  private isInitialized = false

  private constructor() {
    if (!this.isInitialized) {
      // Initialize Firebase Admin SDK if not already initialized
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
          })
        })
      }
      this.isInitialized = true
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    try {
      // Get user's FCM token
      const userDoc = await getDocs(
        query(collection(db, 'users'), where('uid', '==', userId))
      )
      
      if (userDoc.empty) {
        throw new Error('User not found')
      }

      const userData = userDoc.docs[0].data()
      const fcmToken = userData.fcmToken

      if (!fcmToken) {
        throw new Error('User has no FCM token')
      }

      // Send push notification
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title,
          body
        },
        data: data || {}
      })

      // Log notification
      await this.logNotification(userId, 'push', title, body)

      return true
    } catch (error) {
      console.error('Error sending push notification:', error)
      return false
    }
  }

  async sendSMS(userId: string, message: string) {
    try {
      // Get user's phone number
      const userDoc = await getDocs(
        query(collection(db, 'users'), where('uid', '==', userId))
      )
      
      if (userDoc.empty) {
        throw new Error('User not found')
      }

      const userData = userDoc.docs[0].data()
      const phoneNumber = userData.phoneNumber

      if (!phoneNumber) {
        throw new Error('User has no phone number')
      }

      // Send SMS via Twilio
      await twilioClient.messages.create({
        body: message,
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER
      })

      // Log notification
      await this.logNotification(userId, 'sms', 'SMS Alert', message)

      return true
    } catch (error) {
      console.error('Error sending SMS:', error)
      return false
    }
  }

  async sendScheduledNotifications() {
    try {
      const now = new Date()
      
      // Get all pending notifications scheduled for now or earlier
      const notificationsQuery = query(
        collection(db, 'scheduledNotifications'),
        where('status', '==', 'pending'),
        where('scheduledFor', '<=', Timestamp.fromDate(now))
      )

      const snapshot = await getDocs(notificationsQuery)

      for (const doc of snapshot.docs) {
        const notification = doc.data()
        const templateDoc = await getDocs(
          query(collection(db, 'notificationTemplates'), 
          where('id', '==', notification.templateId))
        )

        if (!templateDoc.empty) {
          const template = templateDoc.docs[0].data()
          
          let success = false
          if (template.type === 'push') {
            success = await this.sendPushNotification(
              notification.userId,
              template.title || '',
              template.body
            )
          } else if (template.type === 'sms') {
            success = await this.sendSMS(
              notification.userId,
              template.body
            )
          }

          // Update notification status
          await updateDoc(doc.ref, {
            status: success ? 'sent' : 'failed',
            updatedAt: Timestamp.now()
          })
        }
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error)
    }
  }

  private async logNotification(
    userId: string,
    type: 'push' | 'sms',
    title: string,
    body: string
  ) {
    try {
      await admin.firestore().collection('notificationLogs').add({
        userId,
        type,
        title,
        body,
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      })
    } catch (error) {
      console.error('Error logging notification:', error)
    }
  }
}

export default NotificationService.getInstance() 
import { db } from '@/config/firebase'
import { 
  collection, 
  addDoc, 
  FirestoreError, 
  writeBatch, 
  doc,
  DocumentReference,
  DocumentData,
  Timestamp
} from 'firebase/firestore'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface NotificationMetadata {
  [key: string]: unknown;
  source?: string;
  action?: string;
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
  metadata?: NotificationMetadata;
}

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: NotificationMetadata;
}

export interface CreateBulkNotificationParams extends Omit<CreateNotificationParams, 'userId'> {
  userIds: string[];
}

export class NotificationService {
  private static readonly collection = collection(db, 'notifications');
  private static readonly MAX_BATCH_SIZE = 500;

  private static validateNotificationParams(params: CreateNotificationParams): void {
    if (!params.userId) {
      throw new Error('User ID is required');
    }
    if (!params.title || params.title.length > 100) {
      throw new Error('Title is required and must be less than 100 characters');
    }
    if (!params.message || params.message.length > 500) {
      throw new Error('Message is required and must be less than 500 characters');
    }
    if (!params.type) {
      throw new Error('Notification type is required');
    }
  }

  private static convertToFirestoreData(notification: Notification): DocumentData {
    return {
      ...notification,
      createdAt: Timestamp.fromDate(notification.createdAt),
      metadata: notification.metadata ? {
        ...notification.metadata,
        expiresAt: notification.metadata.expiresAt ? Timestamp.fromDate(notification.metadata.expiresAt) : undefined
      } : undefined
    };
  }

  private static convertFromFirestoreData(docRef: DocumentReference, data: DocumentData): Notification {
    return {
      id: docRef.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toDate(),
      metadata: data.metadata ? {
        ...data.metadata,
        expiresAt: data.metadata.expiresAt ? (data.metadata.expiresAt as Timestamp).toDate() : undefined
      } : undefined
    } as Notification;
  }

  static async createNotification(params: CreateNotificationParams): Promise<Notification> {
    try {
      this.validateNotificationParams(params);

      const notification: Notification = {
        ...params,
        read: false,
        createdAt: new Date()
      };

      const docRef = await addDoc(
        this.collection,
        this.convertToFirestoreData(notification)
      );

      return this.convertFromFirestoreData(docRef, notification);
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error('Error creating notification:', firestoreError);
      throw new Error(`Failed to create notification: ${firestoreError.message}`);
    }
  }

  static async createBulkNotifications(params: CreateNotificationParams[]): Promise<Notification[]> {
    try {
      if (params.length > this.MAX_BATCH_SIZE) {
        throw new Error(`Cannot create more than ${this.MAX_BATCH_SIZE} notifications at once`);
      }

      params.forEach(this.validateNotificationParams);

      const batch = writeBatch(db);
      const notifications: Notification[] = [];

      for (const param of params) {
        const docRef = doc(this.collection);
        const notification: Notification = {
          id: docRef.id,
          ...param,
          read: false,
          createdAt: new Date()
        };

        batch.set(docRef, this.convertToFirestoreData(notification));
        notifications.push(notification);
      }

      await batch.commit();
      return notifications;
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error('Error creating bulk notifications:', firestoreError);
      throw new Error(`Failed to create bulk notifications: ${firestoreError.message}`);
    }
  }

  static async createNotificationsForUsers(params: CreateBulkNotificationParams): Promise<Notification[]> {
    try {
      if (params.userIds.length > this.MAX_BATCH_SIZE) {
        throw new Error(`Cannot create notifications for more than ${this.MAX_BATCH_SIZE} users at once`);
      }

      const notifications = params.userIds.map(userId => ({
        ...params,
        userId
      }));

      return this.createBulkNotifications(notifications);
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error('Error creating notifications for users:', firestoreError);
      throw new Error(`Failed to create notifications for users: ${firestoreError.message}`);
    }
  }
} 
} 
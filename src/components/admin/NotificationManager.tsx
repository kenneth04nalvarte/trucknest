import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NotificationService, Notification } from '@/app/services/NotificationService';
import { FirestoreError } from 'firebase/firestore';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/app/config/firebase';

interface NotificationManagerProps {
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
  className?: string;
  maxNotifications?: number;
}

interface NotificationFormData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId: string;
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  newNotification: NotificationFormData;
}

const initialState: NotificationState = {
  notifications: [],
  loading: true,
  error: null,
  newNotification: {
    title: '',
    message: '',
    type: 'info',
    userId: ''
  }
};

export default function NotificationManager({ 
  onError, 
  onSuccess,
  className,
  maxNotifications = 50 
}: NotificationManagerProps) {
  const { user } = useAuth();
  const [state, setState] = useState<NotificationState>(initialState);

  const loadNotifications = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(maxNotifications)
      );
      const querySnapshot = await getDocs(q);

      const notificationsData: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notificationsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()
        } as Notification);
      });

      setState(prev => ({ ...prev, notifications: notificationsData }));
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error loading notifications:', error);
      const errorMessage = `Failed to load notifications: ${error.message}`;
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(error);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user?.uid, onError, maxNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleCreateNotification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      setState(prev => ({ ...prev, error: null }));
      const notification = await NotificationService.createNotification({
        ...state.newNotification,
        userId: user.uid
      });

      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications],
        newNotification: initialState.newNotification
      }));
      onSuccess?.('Notification created successfully');
    } catch (err) {
      const error = err as Error;
      console.error('Error creating notification:', error);
      const errorMessage = `Failed to create notification: ${error.message}`;
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      newNotification: {
        ...prev.newNotification,
        [name]: value
      }
    }));
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {state.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{state.error}</p>
        </div>
      )}

      <form onSubmit={handleCreateNotification} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={state.newNotification.title}
            onChange={handleInputChange}
            required
            maxLength={100}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={state.newNotification.message}
            onChange={handleInputChange}
            required
            maxLength={500}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            id="type"
            name="type"
            value={state.newNotification.type}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Notification
        </button>
      </form>

      <div className="space-y-4">
        {state.notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg ${
              notification.type === 'info'
                ? 'bg-blue-50 border border-blue-200'
                : notification.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : notification.type === 'warning'
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <h3 className="text-lg font-medium">
              {notification.title}
            </h3>
            <p className="text-gray-600 mt-2">{notification.message}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className={`text-sm ${
                notification.type === 'info'
                  ? 'text-blue-600'
                  : notification.type === 'success'
                  ? 'text-green-600'
                  : notification.type === 'warning'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}>
                {notification.type}
              </span>
              <span className="text-sm text-gray-500">
                {notification.createdAt.toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
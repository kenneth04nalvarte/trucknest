import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  date: string;
}

const NotificationManager: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'System Update',
      message: 'New features have been added to the dashboard',
      type: 'info',
      date: '2024-05-01',
    },
  ]);

  if (!user) {
    return <div>Please sign in to access this feature.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Notification Management</h2>
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="p-4 border rounded"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{notification.title}</h3>
                <p className="text-gray-600">{notification.message}</p>
                <span className="text-sm text-gray-500">{notification.date}</span>
              </div>
              <div className="space-x-2">
                <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Edit
                </button>
                <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Add New Notification
        </button>
      </div>
    </div>
  );
};

export default NotificationManager; 
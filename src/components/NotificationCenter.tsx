import { useEffect, useState } from 'react';
import { db } from '@/config/firebase';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchNotifications();
  }, [user, open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await updateDoc(doc(db, 'notifications', n.id), { read: true });
    }
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open) markAllRead();
  };

  return (
    <div className="relative inline-block">
      <button onClick={handleOpen} className="relative">
        <span className="material-icons text-2xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange text-white rounded-full text-xs px-1">{unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50">
          <div className="p-4 border-b font-bold text-navy">Notifications</div>
          <ul className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="p-4 text-darkgray">No notifications</li>
            ) : notifications.map(n => (
              <li key={n.id} className={`p-4 border-b ${n.read ? 'bg-gray-50' : 'bg-orange/10'}`}>
                <div className="font-semibold">{n.title || 'Notification'}</div>
                <div className="text-sm text-darkgray">{n.body}</div>
                <div className="text-xs text-gray-400 mt-1">{n.createdAt?.toDate?.().toLocaleString?.() || ''}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 
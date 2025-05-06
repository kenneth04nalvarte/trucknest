import { useEffect, useState } from 'react';
import { db } from '@/app/config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface LocationNotification {
  id: string;
  userId: string;
  location: {
    lat: number;
    lng: number;
  };
  radius: number;
  message: string;
  createdAt: Date;
}

export default function LocationNotificationService() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<LocationNotification[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!user) return;

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }

    const notificationsRef = collection(db, 'locationNotifications');
    const q = query(notificationsRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: LocationNotification[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        newNotifications.push({
          id: doc.id,
          userId: data.userId,
          location: data.location,
          radius: data.radius,
          message: data.message,
          createdAt: data.createdAt.toDate(),
        });
      });

      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!currentLocation || notifications.length === 0) return;

    notifications.forEach((notification) => {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        notification.location.lat,
        notification.location.lng
      );

      if (distance <= notification.radius) {
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('Location Alert', {
            body: notification.message,
          });
        }
      }
    });
  }, [currentLocation, notifications]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  return null; // This component doesn't render anything visible
} 
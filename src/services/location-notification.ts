import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { NotificationService } from './NotificationService';

interface LocationNotification {
  id: string;
  userId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  message: string;
  createdAt: Date;
}

interface ParkingSpot {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  available: boolean;
  price: number;
}

export class LocationNotificationService {
  static async createNotification(userId: string, location: { latitude: number; longitude: number }, message: string) {
    try {
      const notification: Omit<LocationNotification, 'id'> = {
        userId,
        location,
        message,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'location-notifications'), notification);
    } catch (error) {
      console.error('Error creating location notification:', error);
    }
  }

  static async startLocationTracking(userId: string, onLocationChange: (location: { latitude: number; longitude: number }) => void) {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          onLocationChange(location);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );

      return watchId;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return null;
    }
  }

  static stopLocationTracking(watchId: number | null) {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  static async findNearbyParkingSpots(location: { latitude: number; longitude: number }, radius: number = 5) {
    try {
      const spotsQuery = query(collection(db, 'parking-spots'));
      const spotsSnapshot = await getDocs(spotsQuery);
      
      const spots: ParkingSpot[] = [];
      spotsSnapshot.forEach(doc => {
        const spot = doc.data() as ParkingSpot;
        const distance = this.calculateDistance(
          location.latitude,
          location.longitude,
          spot.location.latitude,
          spot.location.longitude
        );
        
        if (distance <= radius) {
          spots.push({
            ...spot,
            id: doc.id
          });
        }
      });

      return spots;
    } catch (error) {
      console.error('Error finding nearby parking spots:', error);
      return [];
    }
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }

  private static toRad(value: number) {
    return value * Math.PI / 180;
  }
} 
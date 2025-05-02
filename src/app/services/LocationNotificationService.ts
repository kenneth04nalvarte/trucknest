import { db } from '@/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  GeoPoint,
  addDoc,
  Timestamp
} from 'firebase/firestore'
import { NotificationService } from './NotificationService'

interface ParkingSpot {
  id: string
  name: string
  location: GeoPoint
  address: string
  availableSpaces: number
  pricePerHour: number
  restrictions: {
    maxLength: number
    maxHeight: number
    maxWeight: number
  }
}

interface SpotWithDistance extends ParkingSpot {
  distance: number // in meters
}

class LocationNotificationService {
  private static instance: LocationNotificationService
  private readonly SEARCH_RADIUS_METERS = 1000
  private readonly EARTH_RADIUS_METERS = 6371000 // Earth's radius in meters

  private constructor() {}

  public static getInstance(): LocationNotificationService {
    if (!LocationNotificationService.instance) {
      LocationNotificationService.instance = new LocationNotificationService()
    }
    return LocationNotificationService.instance
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Haversine formula for precise distance calculation
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return this.EARTH_RADIUS_METERS * c // Returns distance in meters
  }

  async findNearbyParkingSpots(
    location: { lat: number; lng: number },
    vehicleRestrictions?: {
      length: number
      height: number
      weight: number
    }
  ): Promise<SpotWithDistance[]> {
    try {
      // Convert radius to degrees (approximate for query)
      const radiusInKm = this.SEARCH_RADIUS_METERS / 1000
      const latDegrees = radiusInKm / 111 // 1 degree of latitude is approximately 111 km
      const lngDegrees = radiusInKm / (111 * Math.cos(location.lat * Math.PI / 180))

      const nearbyQuery = query(
        collection(db, 'parkingSpots'),
        where('location', '>=', new GeoPoint(location.lat - latDegrees, location.lng - lngDegrees)),
        where('location', '<=', new GeoPoint(location.lat + latDegrees, location.lng + lngDegrees))
      )

      const snapshot = await getDocs(nearbyQuery)
      const spots = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ParkingSpot[]

      // Calculate exact distances and filter by radius and vehicle restrictions
      const spotsWithDistance = spots
        .map(spot => ({
          ...spot,
          distance: this.calculateDistance(
            location.lat,
            location.lng,
            spot.location.latitude,
            spot.location.longitude
          )
        }))
        .filter(spot => 
          spot.distance <= this.SEARCH_RADIUS_METERS &&
          spot.availableSpaces > 0 &&
          (!vehicleRestrictions || (
            spot.restrictions.maxLength >= vehicleRestrictions.length &&
            spot.restrictions.maxHeight >= vehicleRestrictions.height &&
            spot.restrictions.maxWeight >= vehicleRestrictions.weight
          ))
        )
        .sort((a, b) => a.distance - b.distance)

      return spotsWithDistance
    } catch (err) {
      console.error('Error finding nearby parking spots:', err)
      return []
    }
  }

  async notifyNearbySpots(
    userId: string,
    location: { lat: number; lng: number },
    vehicleRestrictions?: {
      length: number
      height: number
      weight: number
    }
  ): Promise<void> {
    try {
      const nearbySpots = await this.findNearbyParkingSpots(location, vehicleRestrictions)

      if (nearbySpots.length > 0) {
        // Group spots by area to avoid multiple notifications
        const groupedSpots = this.groupSpotsByArea(nearbySpots)

        for (const area of groupedSpots) {
          const nearestSpot = area.spots[0]
          const distanceText = nearestSpot.distance < 1000 
            ? `${Math.round(nearestSpot.distance)}m`
            : `${(nearestSpot.distance / 1000).toFixed(1)}km`

          const title = 'Parking Available Nearby'
          const body = `${area.spots.length} parking spot${area.spots.length > 1 ? 's' : ''} available near ${area.address} (${distanceText} away)`
          
          // Send push notification
          await NotificationService.sendPushNotification(
            userId,
            title,
            body,
            {
              type: 'nearby_parking',
              latitude: area.location.latitude.toString(),
              longitude: area.location.longitude.toString(),
              spotCount: area.spots.length.toString(),
              distance: nearestSpot.distance.toString()
            }
          )

          // Log notification
          await addDoc(collection(db, 'parkingNotifications'), {
            userId,
            location: new GeoPoint(location.lat, location.lng),
            spotsFound: area.spots.length,
            nearestSpotId: nearestSpot.id,
            distance: nearestSpot.distance,
            createdAt: Timestamp.now()
          })
        }
      }
    } catch (err) {
      console.error('Error sending nearby parking notifications:', err)
    }
  }

  private groupSpotsByArea(spots: SpotWithDistance[]): {
    address: string
    location: GeoPoint
    spots: SpotWithDistance[]
  }[] {
    const areas = new Map<string, {
      address: string
      location: GeoPoint
      spots: SpotWithDistance[]
    }>()

    for (const spot of spots) {
      // Use the first part of the address as the area key
      const areaKey = spot.address.split(',')[0]
      
      if (!areas.has(areaKey)) {
        areas.set(areaKey, {
          address: spot.address,
          location: spot.location,
          spots: []
        })
      }

      areas.get(areaKey)!.spots.push(spot)
    }

    // Sort areas by the distance of their nearest spot
    return Array.from(areas.values())
      .map(area => ({
        ...area,
        spots: area.spots.sort((a, b) => a.distance - b.distance)
      }))
      .sort((a, b) => a.spots[0].distance - b.spots[0].distance)
  }

  async startLocationTracking(
    userId: string,
    vehicleRestrictions?: {
      length: number
      height: number
      weight: number
    }
  ): Promise<number> {
    // Start watching position and notify about nearby spots
    return navigator.geolocation.watchPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }

        await this.notifyNearbySpots(userId, location, vehicleRestrictions)
      },
      (error) => {
        console.error('Error tracking location:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  }

  stopLocationTracking(watchId: number): void {
    navigator.geolocation.clearWatch(watchId)
  }
}

export default LocationNotificationService.getInstance() 
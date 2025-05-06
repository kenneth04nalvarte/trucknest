'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/app/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  GeoPoint,
  Timestamp,
  getDoc,
  doc
} from 'firebase/firestore'
import { Loader } from '@googlemaps/js-api-loader'
import { LocationNotificationService } from '@/services/location-notification'

interface ParkingSpot {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  available: boolean;
  price: number;
  distance?: number;
}

interface Vehicle {
  id: string
  name: string
  type: string
  length: number
  height: number
  weight: number
  isDefault: boolean
}

export default function RoutePlanner() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [nearbySpots, setNearbySpots] = useState<ParkingSpot[]>([])
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false)
  const [defaultVehicle, setDefaultVehicle] = useState<Vehicle | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([])
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const locationWatchIdRef = useRef<number | null>(null)

  useEffect(() => {
    const initializeMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
          version: 'weekly',
          libraries: ['places']
        })

        const google = await loader.load()
        
        if (mapRef.current) {
          const map = new google.maps.Map(mapRef.current, {
            center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
            zoom: 12
          })

          googleMapRef.current = map
          directionsServiceRef.current = new google.maps.DirectionsService()
          directionsRendererRef.current = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true
          })

          // Initialize autocomplete for origin and destination inputs
          const originInput = document.getElementById('origin-input') as HTMLInputElement
          const destinationInput = document.getElementById('destination-input') as HTMLInputElement

          new google.maps.places.Autocomplete(originInput)
          new google.maps.places.Autocomplete(destinationInput)
        }

        // Load default vehicle
        await loadDefaultVehicle()

        setLoading(false)
      } catch (err) {
        console.error('Error initializing map:', err)
        setError('Failed to load Google Maps')
        setLoading(false)
      }
    }

    initializeMap()

    // Cleanup location tracking on unmount
    return () => {
      if (locationWatchIdRef.current !== null) {
        LocationNotificationService.stopLocationTracking(locationWatchIdRef.current)
      }
    }
  }, [])

  const loadDefaultVehicle = async () => {
    try {
      const vehiclesQuery = query(
        collection(db, 'vehicles'),
        where('userId', '==', user?.uid),
        where('isDefault', '==', true)
      )
      const snapshot = await getDocs(vehiclesQuery)
      
      if (!snapshot.empty) {
        const vehicleData = snapshot.docs[0].data() as Vehicle
        setDefaultVehicle({
          ...vehicleData,
          id: snapshot.docs[0].id
        })
      }
    } catch (err) {
      console.error('Error loading default vehicle:', err)
      setError('Failed to load default vehicle')
    }
  }

  const calculateRoute = async () => {
    if (!origin || !destination || !directionsServiceRef.current || !directionsRendererRef.current) {
      return
    }

    try {
      const result = await directionsServiceRef.current.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING
      })

      directionsRendererRef.current.setDirections(result)

      // Get route waypoints for finding nearby parking
      const route = result.routes[0]
      const waypoints = route.overview_path.filter((_, index) => index % 20 === 0) // Sample points along route

      // Find parking spots near route
      await findParkingNearRoute(waypoints)
    } catch (err) {
      console.error('Error calculating route:', err)
      setError('Failed to calculate route')
    }
  }

  const findParkingNearRoute = async (waypoints: google.maps.LatLng[]) => {
    try {
      const parkingSpots: ParkingSpot[] = []
      const processedSpotIds = new Set()

      for (const point of waypoints) {
        const location = {
          latitude: point.lat(),
          longitude: point.lng()
        }

        const nearbySpots = await LocationNotificationService.findNearbyParkingSpots(location)

        nearbySpots.forEach(spot => {
          if (!processedSpotIds.has(spot.id)) {
            parkingSpots.push(spot)
            processedSpotIds.add(spot.id)

            // Add marker to map
            if (googleMapRef.current) {
              const marker = new google.maps.Marker({
                position: { lat: spot.location.latitude, lng: spot.location.longitude },
                map: googleMapRef.current,
                title: `${spot.address} (${formatDistance((spot as any).distance ?? 0)})`,
                icon: {
                  url: '/parking-marker.png',
                  scaledSize: new google.maps.Size(32, 32)
                }
              })

              marker.addListener('click', () => {
                setSelectedSpot(spot)
              })
            }
          }
        })
      }

      setNearbySpots(parkingSpots)
    } catch (err) {
      console.error('Error finding parking spots:', err)
      setError('Failed to find parking spots')
    }
  }

  const formatDistance = (distance: number): string => {
    return distance < 1000
      ? `${Math.round(distance)}m`
      : `${(distance / 1000).toFixed(1)}km`
  }

  const toggleLocationTracking = async () => {
    if (isTrackingEnabled) {
      if (locationWatchIdRef.current !== null) {
        LocationNotificationService.stopLocationTracking(locationWatchIdRef.current)
        locationWatchIdRef.current = null
      }
      setIsTrackingEnabled(false)
    } else {
      if (!defaultVehicle) {
        setError('Please set a default vehicle to enable notifications')
        return
      }

      const watchId = await LocationNotificationService.startLocationTracking(
        user!.uid,
        handleLocationChange
      )
      locationWatchIdRef.current = watchId
      setIsTrackingEnabled(true)
    }
  }

  const handleBookParking = async (spotId: string) => {
    // Implement booking logic here
  }

  const fetchVehicle = async (vehicleId: string) => {
    try {
      const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
      if (vehicleDoc.exists()) {
        const vehicleData = vehicleDoc.data();
        return {
          ...vehicleData,
          id: vehicleDoc.id
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return null;
    }
  };

  const handleLocationChange = (location: { latitude: number; longitude: number }) => {
    setCurrentLocation(location);
    findNearbySpots(location);
  };

  const findNearbySpots = async (location: { latitude: number; longitude: number }) => {
    try {
      const spots = await LocationNotificationService.findNearbyParkingSpots(location);
      const spotsWithDistance = spots.map(spot => ({
        ...spot,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
          spot.location.latitude,
          spot.location.longitude
        )
      }));
      setParkingSpots(spotsWithDistance);
    } catch (error) {
      console.error('Error finding nearby spots:', error);
    }
  };

  const startTracking = async () => {
    if (!defaultVehicle) return;

    const watchId = await LocationNotificationService.startLocationTracking(
      user?.uid || '',
      handleLocationChange
    );

    locationWatchIdRef.current = watchId;
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Location Tracking Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Parking Notifications</h2>
            <p className="text-sm text-gray-500">
              {isTrackingEnabled
                ? 'You will be notified when parking spots are available nearby'
                : 'Enable notifications to get alerts about available parking spots near you'}
            </p>
          </div>
          <button
            onClick={toggleLocationTracking}
            className={`px-4 py-2 rounded-md ${
              isTrackingEnabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isTrackingEnabled ? 'Stop Tracking' : 'Start Tracking'}
          </button>
        </div>
        {!defaultVehicle && (
          <p className="mt-2 text-sm text-yellow-600">
            Set a default vehicle in the vehicles page to enable notifications
          </p>
        )}
      </div>

      {/* Route Input */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Plan Your Route</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Starting Point</label>
            <input
              id="origin-input"
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              placeholder="Enter starting location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Destination</label>
            <input
              id="destination-input"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              placeholder="Enter destination"
            />
          </div>

          <button
            onClick={calculateRoute}
            disabled={!origin || !destination}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            Calculate Route
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div ref={mapRef} className="h-[500px] w-full" />
      </div>

      {/* Nearby Parking Spots */}
      {nearbySpots.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Available Parking Spots</h2>
          <div className="space-y-4">
            {nearbySpots.map(spot => (
              <div
                key={spot.id}
                className={`border rounded-lg p-4 ${
                  selectedSpot?.id === spot.id ? 'border-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-900">{spot.address}</h3>
                      {spot.distance && (
                        <span className="text-sm text-gray-500">
                          ({formatDistance(spot.distance)})
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Status: {spot.available ? 'Available' : 'Unavailable'} • ${spot.price}/hour
                    </p>
                  </div>
                  <button
                    onClick={() => handleBookParking(spot.id)}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 
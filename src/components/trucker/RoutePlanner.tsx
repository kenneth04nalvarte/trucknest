'use client';

import { useState, useEffect } from 'react';
import { db } from '@/app/config/firebase';
import { collection, query, where, getDocs, getDoc, doc, FirestoreError } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import Map from '@/components/Map';
import { LocationNotificationService } from '@/services/location-notification';
import AddressAutocomplete from '@/components/AddressAutocomplete';

interface Vehicle {
  id: string;
  type: 'semi' | 'van' | 'box_truck' | 'other';
  licensePlate: string;
  make: string;
  model: string;
  year: string;
  height: number;
  width: number;
  length: number;
  weight: number;
  userId: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Location {
  lat: number;
  lng: number;
}

interface Route {
  id: string;
  startLocation: Location;
  endLocation: Location;
  waypoints: Location[];
  distance: number;
  duration: number;
  vehicleId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function RoutePlanner() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!user?.uid) return;

    const fetchVehicles = async () => {
      try {
        const vehiclesRef = collection(db, 'vehicles');
        const q = query(vehiclesRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const vehiclesData: Vehicle[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          vehiclesData.push({
            id: doc.id,
            type: data.type as Vehicle['type'],
            licensePlate: data.licensePlate,
            make: data.make,
            model: data.model,
            year: data.year,
            height: data.height,
            width: data.width,
            length: data.length,
            weight: data.weight,
            userId: data.userId,
            isDefault: data.isDefault,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        });

        setVehicles(vehiclesData);
        if (vehiclesData.length > 0) {
          const defaultVehicle = vehiclesData.find(v => v.isDefault) || vehiclesData[0];
          setSelectedVehicle(defaultVehicle);
        }
      } catch (err) {
        const error = err as FirestoreError;
        console.error('Error fetching vehicles:', error);
        setError(`Failed to load vehicles: ${error.message}`);
      }
    };

    fetchVehicles();
  }, [user?.uid]);

  const handlePlanRoute = async () => {
    if (!selectedVehicle || !startLocation || !endLocation) {
      setError('Please select a vehicle and enter both locations');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Implement route planning logic using Google Maps API
      // This is a placeholder for the actual implementation
      const mockRoute: Route = {
        id: '',
        startLocation: { lat: 0, lng: 0 },
        endLocation: { lat: 0, lng: 0 },
        waypoints: [],
        distance: 0,
        duration: 0,
        vehicleId: selectedVehicle.id,
        userId: user?.uid || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setRoute(mockRoute);
    } catch (err) {
      const error = err as Error;
      console.error('Error planning route:', error);
      setError(`Failed to plan route: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicle = async (vehicleId: string): Promise<Vehicle | null> => {
    try {
      const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
      if (!vehicleDoc.exists()) return null;

      const data = vehicleDoc.data();
      return {
        id: vehicleDoc.id,
        type: data.type as Vehicle['type'],
        licensePlate: data.licensePlate,
        make: data.make,
        model: data.model,
        year: data.year,
        height: data.height,
        width: data.width,
        length: data.length,
        weight: data.weight,
        userId: data.userId,
        isDefault: data.isDefault,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error fetching vehicle:', error);
      setError(`Failed to fetch vehicle: ${error.message}`);
      return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Route Planner</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Vehicle
            </label>
            <select
              value={selectedVehicle?.id || ''}
              onChange={(e) => {
                const vehicle = vehicles.find((v) => v.id === e.target.value);
                setSelectedVehicle(vehicle || null);
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} ({vehicle.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Location
            </label>
            <AddressAutocomplete
              value={startLocation}
              onAddressSelect={setStartLocation}
              placeholder="Enter start location"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Location
            </label>
            <AddressAutocomplete
              value={endLocation}
              onAddressSelect={setEndLocation}
              placeholder="Enter end location"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handlePlanRoute}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Planning Route...' : 'Plan Route'}
          </button>

          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}
        </div>

        <div className="h-[400px]">
          {route && (
            <Map
              center={{
                lat: (route.startLocation.lat + route.endLocation.lat) / 2,
                lng: (route.startLocation.lng + route.endLocation.lng) / 2,
              }}
              markers={[
                {
                  position: route.startLocation,
                  title: 'Start',
                },
                {
                  position: route.endLocation,
                  title: 'End',
                },
              ]}
            />
          )}
        </div>
      </div>

      {route && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Route Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-gray-700">Distance</h3>
              <p className="text-2xl font-bold">{route.distance} km</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-gray-700">Duration</h3>
              <p className="text-2xl font-bold">{route.duration} min</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-gray-700">Restrictions</h3>
              <ul className="mt-2">
                {route.waypoints.map((waypoint, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    {waypoint.lat}, {waypoint.lng}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
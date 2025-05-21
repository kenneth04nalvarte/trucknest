'use client';

import { useState } from 'react';
import Map from '@/components/Map';

interface PropertyNearbyAmenitiesProps {
  location: { lat: number; lng: number };
  propertyName: string;
}

interface Place {
  name: string;
  vicinity: string;
  types: string[];
  geometry: { location: { lat: () => number; lng: () => number } };
  distance?: number;
}

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  // Haversine formula
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function PropertyNearbyAmenities({ location, propertyName }: PropertyNearbyAmenitiesProps) {
  const [places, setPlaces] = useState<Place[]>([]);

  // Group places by type
  const restaurants = places.filter(p => p.types?.includes('restaurant'));
  const gasStations = places.filter(p => p.types?.includes('gas_station'));

  // Calculate distance for each place
  const withDistance = (arr: Place[]) =>
    arr.map(place => ({
      ...place,
      distance:
        place.geometry?.location &&
        getDistanceMeters(
          location.lat,
          location.lng,
          place.geometry.location.lat(),
          place.geometry.location.lng()
        ),
    }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

  return (
    <>
      {/* Map */}
      <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Location</h2>
        <Map
          center={location}
          markers={[{ position: location, title: propertyName }]}
        />
      </section>

      {/* Nearby Amenities */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-4">Nearby Amenities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Restaurants</h3>
            <ul className="space-y-2">
              {withDistance(restaurants).length === 0 && <li className="text-gray-500">No restaurants found nearby.</li>}
              {withDistance(restaurants).map(place => (
                <li key={place.name + place.vicinity} className="flex flex-col">
                  <span className="font-medium">{place.name}</span>
                  <span className="text-sm text-gray-600">{place.vicinity}</span>
                  {place.distance !== undefined && (
                    <span className="text-xs text-gray-400">
                      {(place.distance / 1609.34).toFixed(2)} mi away
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Gas Stations</h3>
            <ul className="space-y-2">
              {withDistance(gasStations).length === 0 && <li className="text-gray-500">No gas stations found nearby.</li>}
              {withDistance(gasStations).map(place => (
                <li key={place.name + place.vicinity} className="flex flex-col">
                  <span className="font-medium">{place.name}</span>
                  <span className="text-sm text-gray-600">{place.vicinity}</span>
                  {place.distance !== undefined && (
                    <span className="text-xs text-gray-400">
                      {(place.distance / 1609.34).toFixed(2)} mi away
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
} 
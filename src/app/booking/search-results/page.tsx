'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Mock data for available spots
const mockSpots = [
  {
    id: '1',
    name: 'Truck Haven Parking',
    address: '123 Main St, City, State 12345',
    price: 25,
    rating: 4.5,
    reviews: 128,
    amenities: ['24/7 Security', 'Restrooms', 'Showers', 'WiFi'],
    distance: '2.5 miles',
    availableSpots: 5,
  },
  {
    id: '2',
    name: 'Safe Spot Truck Parking',
    address: '456 Oak Ave, City, State 12345',
    price: 30,
    rating: 4.8,
    reviews: 256,
    amenities: ['24/7 Security', 'Restrooms', 'Showers', 'WiFi', 'Food Court'],
    distance: '3.1 miles',
    availableSpots: 3,
  },
  {
    id: '3',
    name: 'Truckers Rest Stop',
    address: '789 Pine Rd, City, State 12345',
    price: 20,
    rating: 4.2,
    reviews: 89,
    amenities: ['24/7 Security', 'Restrooms', 'Showers'],
    distance: '4.0 miles',
    availableSpots: 8,
  },
]

export default function SearchResults() {
  const { user } = useAuth()
  const router = useRouter()
  const [sortBy, setSortBy] = useState('price')

  const handleBooking = (spotId: string) => {
    router.push(`/booking/confirm/${spotId}`)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-lightgray">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-navy">Available Parking Spots</h1>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 border border-lightgray rounded"
            >
              <option value="price">Sort by Price</option>
              <option value="rating">Sort by Rating</option>
              <option value="distance">Sort by Distance</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {mockSpots.map((spot) => (
              <div key={spot.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-navy mb-2">{spot.name}</h2>
                    <p className="text-darkgray mb-4">{spot.address}</p>
                    
                    <div className="flex items-center mb-4">
                      <div className="flex items-center text-orange mr-4">
                        <span className="mr-1">★</span>
                        <span>{spot.rating}</span>
                        <span className="text-darkgray ml-1">({spot.reviews} reviews)</span>
                      </div>
                      <span className="text-darkgray">{spot.distance}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {spot.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="bg-lightgray text-darkgray px-3 py-1 rounded-full text-sm"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="md:ml-6 mt-4 md:mt-0 flex flex-col items-end">
                    <div className="text-2xl font-bold text-navy mb-2">
                      ${spot.price}<span className="text-darkgray text-base font-normal">/day</span>
                    </div>
                    <div className="text-green mb-4">
                      {spot.availableSpots} spots available
                    </div>
                    <button
                      onClick={() => handleBooking(spot.id)}
                      className="bg-orange hover:bg-orange-dark text-white px-6 py-2 rounded font-semibold"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 
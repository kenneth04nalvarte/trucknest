'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '@/config/firebase'
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore'
import AddressAutocomplete from './AddressAutocomplete'

interface ParkingSpot {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  hourlyRate: number
  dailyRate: number
  weeklyRate: number
  monthlyRate: number
  amenities: string[]
  size: {
    length: number
    width: number
    height: number
  }
  ownerId: string
  ownerName: string
}

interface BookingFormData {
  startDate: string
  endDate: string
  vehicleType: string
  parkingSpotId: string
  specialRequirements: string
  address: string
  lat: number
  lng: number
}

export default function BookingForm() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([])
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)
  const [totalPrice, setTotalPrice] = useState(0)
  const [formData, setFormData] = useState<BookingFormData>({
    startDate: '',
    endDate: '',
    vehicleType: 'semi',
    parkingSpotId: '',
    specialRequirements: '',
    address: '',
    lat: 0,
    lng: 0,
  })

  useEffect(() => {
    loadParkingSpots()
  }, [])

  useEffect(() => {
    if (formData.startDate && formData.endDate && selectedSpot) {
      calculatePrice()
    }
  }, [formData.startDate, formData.endDate, selectedSpot])

  const loadParkingSpots = async () => {
    try {
      const spotsQuery = query(collection(db, 'parkingSpots'))
      const snapshot = await getDocs(spotsQuery)
      const spotsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ParkingSpot[]
      setParkingSpots(spotsList)
    } catch (error) {
      console.error('Error loading parking spots:', error)
      setError('Failed to load parking spots')
    }
  }

  const calculatePrice = () => {
    if (!selectedSpot || !formData.startDate || !formData.endDate) return

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60))
    const days = Math.ceil(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)

    let price = 0
    if (months > 0) {
      price = months * selectedSpot.monthlyRate
      const remainingDays = days % 30
      if (remainingDays > 0) {
        price += Math.min(remainingDays * selectedSpot.dailyRate, selectedSpot.monthlyRate)
      }
    } else if (weeks > 0) {
      price = weeks * selectedSpot.weeklyRate
      const remainingDays = days % 7
      if (remainingDays > 0) {
        price += Math.min(remainingDays * selectedSpot.dailyRate, selectedSpot.weeklyRate)
      }
    } else if (days > 0) {
      price = Math.min(days * selectedSpot.dailyRate, selectedSpot.weeklyRate)
    } else {
      price = Math.min(hours * selectedSpot.hourlyRate, selectedSpot.dailyRate)
    }

    setTotalPrice(price)
  }

  const checkAvailability = async (spotId: string, start: Date, end: Date) => {
    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('parkingSpotId', '==', spotId),
        where('status', '==', 'confirmed')
      )
      const snapshot = await getDocs(bookingsQuery)
      
      for (const doc of snapshot.docs) {
        const booking = doc.data()
        const bookingStart = booking.startDate.toDate()
        const bookingEnd = booking.endDate.toDate()
        
        if (
          (start >= bookingStart && start < bookingEnd) ||
          (end > bookingStart && end <= bookingEnd) ||
          (start <= bookingStart && end >= bookingEnd)
        ) {
          return false
        }
      }
      
      return true
    } catch (error) {
      console.error('Error checking availability:', error)
      return false
    }
  }

  const handleSpotSelect = async (spotId: string) => {
    const spot = parkingSpots.find(s => s.id === spotId)
    if (!spot) return

    setSelectedSpot(spot)
    setFormData(prev => ({
      ...prev,
      parkingSpotId: spotId,
      address: spot.address,
      lat: spot.lat,
      lng: spot.lng
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!user) {
      setError('You must be logged in to make a booking')
      return
    }

    if (!selectedSpot) {
      setError('Please select a parking spot')
      return
    }

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)

    if (start >= end) {
      setError('End date must be after start date')
      return
    }

    const isAvailable = await checkAvailability(selectedSpot.id, start, end)
    if (!isAvailable) {
      setError('This parking spot is not available for the selected dates')
      return
    }

    try {
      setLoading(true)

      await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        parkingSpotId: selectedSpot.id,
        ownerId: selectedSpot.ownerId,
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        vehicleType: formData.vehicleType,
        specialRequirements: formData.specialRequirements,
        location: {
          address: selectedSpot.address,
          lat: selectedSpot.lat,
          lng: selectedSpot.lng
        },
        totalPrice,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      setSuccess(true)
      setFormData({
        startDate: '',
        endDate: '',
        vehicleType: 'semi',
        parkingSpotId: '',
        specialRequirements: '',
        address: '',
        lat: 0,
        lng: 0,
      })
      setSelectedSpot(null)
      setTotalPrice(0)
    } catch (error) {
      console.error('Error creating booking:', error)
      setError('Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Book a Parking Spot</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              value={formData.startDate}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              value={formData.endDate}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">
            Vehicle Type
          </label>
          <select
            id="vehicleType"
            name="vehicleType"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            value={formData.vehicleType}
            onChange={handleInputChange}
          >
            <option value="semi">Semi-Truck</option>
            <option value="box">Box Truck</option>
            <option value="van">Van</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Parking Spot
          </label>
          <div className="grid grid-cols-1 gap-4">
            {parkingSpots.map(spot => (
              <div
                key={spot.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedSpot?.id === spot.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleSpotSelect(spot.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{spot.name}</h3>
                    <p className="text-sm text-gray-500">{spot.address}</p>
                    <div className="mt-2 text-sm">
                      <p>Size: {spot.size.length}' x {spot.size.width}' x {spot.size.height}'</p>
                      <p className="mt-1">
                        Rates: ${spot.hourlyRate}/hr | ${spot.dailyRate}/day | ${spot.weeklyRate}/week
                      </p>
                    </div>
                    {spot.amenities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {spot.amenities.map(amenity => (
                          <span
                            key={amenity}
                            className="px-2 py-1 text-xs bg-gray-100 rounded-full"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700">
            Special Requirements
          </label>
          <textarea
            id="specialRequirements"
            name="specialRequirements"
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            value={formData.specialRequirements}
            onChange={handleInputChange}
          />
        </div>

        {totalPrice > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">Total Price</h3>
            <p className="mt-1 text-2xl font-bold text-blue-600">${totalPrice.toFixed(2)}</p>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {success && (
          <div className="text-green-600 text-sm">Booking created successfully!</div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading || !selectedSpot}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              (loading || !selectedSpot) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Creating Booking...' : 'Book Now'}
          </button>
        </div>
      </form>
    </div>
  )
} 
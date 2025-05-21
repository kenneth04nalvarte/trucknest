'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '@/app/config/firebase'
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import AddressAutocomplete from './AddressAutocomplete'
import BookAndPayButton from './BookAndPayButton'

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
  ownerStripeAccountId: string
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

interface BookingFormProps {
  selectedSpot: {
    id: string
    ownerId: string
    address: string
    lat: number
    lng: number
    hourlyRate: number
    dailyRate: number
    weeklyRate: number
    monthlyRate: number
    ownerStripeAccountId: string
  } | null
}

export default function BookingForm({ selectedSpot }: BookingFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([])
  const [selectedParkingSpot, setSelectedParkingSpot] = useState<ParkingSpot | null>(null)
  const [totalPrice, setTotalPrice] = useState(0)
  const [bookingId, setBookingId] = useState<string | null>(null)
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
    if (formData.startDate && formData.endDate && selectedParkingSpot) {
      calculatePrice()
    }
  }, [formData.startDate, formData.endDate, selectedParkingSpot])

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
    if (!selectedParkingSpot || !formData.startDate || !formData.endDate) return

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60))
    const days = Math.ceil(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)

    let price = 0
    if (months > 0) {
      price = months * selectedParkingSpot.monthlyRate
      const remainingDays = days % 30
      if (remainingDays > 0) {
        price += Math.min(remainingDays * selectedParkingSpot.dailyRate, selectedParkingSpot.monthlyRate)
      }
    } else if (weeks > 0) {
      price = weeks * selectedParkingSpot.weeklyRate
      const remainingDays = days % 7
      if (remainingDays > 0) {
        price += Math.min(remainingDays * selectedParkingSpot.dailyRate, selectedParkingSpot.weeklyRate)
      }
    } else if (days > 0) {
      price = Math.min(days * selectedParkingSpot.dailyRate, selectedParkingSpot.weeklyRate)
    } else {
      price = Math.min(hours * selectedParkingSpot.hourlyRate, selectedParkingSpot.dailyRate)
    }

    setTotalPrice(price)
  }

  const checkAvailability = async (spotId: string, start: Date, end: Date) => {
    const bookingsRef = collection(db, 'bookings')
    const q = query(
      bookingsRef,
      where('parkingSpotId', '==', spotId),
      where('status', 'in', ['pending', 'confirmed'])
    )
    
    const querySnapshot = await getDocs(q)
    const bookings = querySnapshot.docs.map(doc => doc.data())
    
    return !bookings.some(booking => {
      const bookingStart = booking.startDate.toDate()
      const bookingEnd = booking.endDate.toDate()
      return (start < bookingEnd && end > bookingStart)
    })
  }

  const handleSpotSelect = async (spotId: string) => {
    const spot = parkingSpots.find(s => s.id === spotId)
    if (!spot) return

    setSelectedParkingSpot(spot)
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    calculatePrice()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!user) {
      setError('You must be logged in to make a booking')
      return
    }

    if (!selectedParkingSpot) {
      setError('Please select a parking spot')
      return
    }

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)

    if (start >= end) {
      setError('End date must be after start date')
      return
    }

    const isAvailable = await checkAvailability(selectedParkingSpot.id, start, end)
    if (!isAvailable) {
      setError('This parking spot is not available for the selected dates')
      return
    }

    try {
      setLoading(true)

      const bookingRef = await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        parkingSpotId: selectedParkingSpot.id,
        ownerId: selectedParkingSpot.ownerId,
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        vehicleType: formData.vehicleType,
        specialRequirements: formData.specialRequirements,
        location: {
          address: selectedParkingSpot.address,
          lat: selectedParkingSpot.lat,
          lng: selectedParkingSpot.lng
        },
        totalPrice,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      setBookingId(bookingRef.id)
      setSuccess(true)
    } catch (error) {
      console.error('Error creating booking:', error)
      setError('Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Book Parking Spot</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Start Date & Time
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
            End Date & Time
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
            <option value="semi">Semi Truck</option>
            <option value="box_truck">Box Truck</option>
            <option value="pickup">Pickup Truck</option>
            <option value="other">Other</option>
          </select>
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

        {success && bookingId && selectedParkingSpot && user && (
          <div className="space-y-4">
            <div className="text-green-600 text-sm">Booking created successfully! Proceed to payment:</div>
            <BookAndPayButton
              propertyId={selectedParkingSpot.id}
              price={totalPrice}
            />
          </div>
        )}

        {!success && (
          <div>
            <button
              type="submit"
              disabled={loading || !selectedParkingSpot}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                (loading || !selectedParkingSpot) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating Booking...' : 'Book Now'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
} 
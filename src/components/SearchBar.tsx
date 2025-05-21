'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AddressAutocomplete from './AddressAutocomplete'

const vehicleTypes = [
  { label: 'Bobtail Truck', value: 'bobtail_truck' },
  { label: 'Truck and Trailer', value: 'truck_and_trailer' },
  { label: 'RV', value: 'rv' },
  { label: 'Boat', value: 'boat' },
  { label: 'Container', value: 'container' },
  { label: 'Heavy Equipment', value: 'heavy_equipment' },
]

export default function SearchBar() {
  const router = useRouter()
  const [address, setAddress] = useState('')
  const [vehicleType, setVehicleType] = useState(vehicleTypes[0].value)
  const [parkingType, setParkingType] = useState<'short-term' | 'monthly'>('short-term')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [monthlyStart, setMonthlyStart] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(
      `/search?address=${encodeURIComponent(address)}&vehicleType=${vehicleType}&parkingType=${parkingType}&checkIn=${checkIn}&checkOut=${checkOut}&monthlyStart=${monthlyStart}`
    )
  }

  return (
    <section className="py-16 bg-lightgray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSearch} className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl flex flex-col gap-6 border border-gray-200 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <span className="absolute left-3 top-9 text-gray-400 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </span>
              <AddressAutocomplete
                value={address}
                onAddressSelect={setAddress}
                placeholder="Enter address"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange bg-gray-50 transition-shadow focus:shadow-lg placeholder-gray-500 text-gray-700"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type
              </label>
              <span className="absolute left-3 top-9 text-gray-400 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9V7a5 5 0 0110 0v2m-1 4h-8a2 2 0 00-2 2v4h12v-4a2 2 0 00-2-2z" />
                </svg>
              </span>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange bg-gray-50 transition-shadow focus:shadow-lg placeholder-gray-500 text-gray-700"
              >
                {vehicleTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parking Type
              </label>
              <select
                value={parkingType}
                onChange={(e) => setParkingType(e.target.value as 'short-term' | 'monthly')}
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange bg-gray-50 transition-shadow focus:shadow-lg placeholder-gray-500 text-gray-700"
              >
                <option value="short-term">Short Term</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {parkingType === 'short-term' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check In
                  </label>
                  <input
                    type="datetime-local"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange bg-gray-50 transition-shadow focus:shadow-lg placeholder-gray-500 text-gray-700"
                    placeholder="Check In"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check Out
                  </label>
                  <input
                    type="datetime-local"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange bg-gray-50 transition-shadow focus:shadow-lg placeholder-gray-500 text-gray-700"
                    placeholder="Check Out"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={monthlyStart}
                  onChange={(e) => setMonthlyStart(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange bg-gray-50 transition-shadow focus:shadow-lg placeholder-gray-500 text-gray-700"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end mt-2">
            <button
              type="submit"
              className="flex items-center justify-center bg-orange hover:bg-orange-dark text-white rounded-full w-12 h-12 shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange"
              aria-label="Search Parking Spots"
              title="Search Parking Spots"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 104 4a7 7 0 0013 13z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </section>
  )
} 
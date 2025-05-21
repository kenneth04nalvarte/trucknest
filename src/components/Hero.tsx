'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

export default function Hero({ children }: { children?: ReactNode }) {
  const router = useRouter()

  const handleFindParkingNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          router.push(`/booking/search-results?lat=${latitude}&lng=${longitude}&radius=50`)
        },
        (error) => {
          alert('Unable to access your location. Please enable location services and try again.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser.')
    }
  }

  return (
    <div className="relative h-[800px] pt-24 pb-24">
      <div className="absolute inset-0">
        <img
          src="/handshake-hero.jpg.jpg"
          alt="Truck parking handshake"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col items-center justify-center">
        <div className="text-white max-w-2xl mt-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 mt-16">
            Your Shortcut to Your Next Stop
          </h1>
          <p className="text-xl mb-8">
            Book safe, convenient parking for your truck, trailer, or RV. Available 24/7.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={handleFindParkingNearMe}
              className="bg-orange hover:bg-orange-dark text-white px-6 py-3 rounded-md text-lg font-semibold shadow transition-colors"
            >
              Find Parking Near Me
            </button>
            <Link
              href="/auth?mode=signup&role=landmember"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-lg font-semibold shadow transition text-center"
            >
              List Your Space
            </Link>
          </div>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>
  )
} 
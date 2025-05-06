'use client'

import Link from 'next/link'
import { useAuth } from './context/AuthContext'
import { useState } from 'react'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import Map from '@/components/Map'

const vehicleTypes = [
  { label: 'Semi Truck', value: 'semi' },
  { label: 'Box Truck', value: 'box_truck' },
  { label: 'Van', value: 'van' },
  { label: 'Other', value: 'other' },
]

export default function HomePage() {
  const { user, loading } = useAuth()
  const [address, setAddress] = useState('')
  const [vehicleType, setVehicleType] = useState(vehicleTypes[0].value)
  const [date, setDate] = useState('')
  const [duration, setDuration] = useState('1')

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lightgray">
      {/* Navbar Example */}
      <nav className="w-full bg-navy text-white shadow-md py-4 px-6 flex justify-between items-center fixed top-0 left-0 z-20">
        <Link href="/" className="text-2xl font-bold tracking-tight">TruckNest</Link>
        <div className="flex gap-4 items-center">
          <Link href="/auth?role=trucker" className="bg-white text-navy border border-navy px-4 py-2 rounded hover:bg-navy hover:text-white transition">Trucker Sign In</Link>
          <Link href="/auth?role=landmember" className="bg-white text-navy border border-navy px-4 py-2 rounded hover:bg-navy hover:text-white transition">Land Member Sign In</Link>
          <Link href="/auth?mode=signup" className="bg-orange hover:bg-orange-dark text-white px-4 py-2 rounded font-semibold shadow transition">Sign Up</Link>
          <Link href="#contact" className="px-4 py-2 text-white hover:text-orange transition">Contact Us</Link>
          <Link href="#how-it-works" className="px-4 py-2 text-white hover:text-orange transition">How It Works</Link>
        </div>
      </nav>

      {/* Hero Section Example */}
      <div className="relative h-[420px] flex items-center justify-center bg-gradient-to-br from-navy to-navy-dark pt-20">
        <img
          src="/hero-truck-parking.jpg"
          alt="Truck Parking Hero"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
        />
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-4">
            Find & Book Secure Truck Parking
          </h1>
          <p className="text-lg md:text-2xl text-white mb-8 drop-shadow">
            The easiest way to find safe, reliable parking for your truck—anywhere, anytime.
          </p>
          {/* Search Bar Example */}
          <form
            className="bg-white bg-opacity-95 rounded-xl shadow-lg p-4 flex flex-col md:flex-row gap-3 items-center max-w-3xl mx-auto"
            onSubmit={e => {
              e.preventDefault()
              // Implement search logic or redirect
            }}
          >
            <div className="flex-1 w-full min-w-[200px]">
              <AddressAutocomplete
                value={address}
                onAddressSelect={setAddress}
                placeholder="Enter destination or address"
                className="w-full px-3 py-2 border border-navy rounded-md focus:ring-2 focus:ring-orange"
              />
            </div>
            <select
              className="w-full md:w-40 px-3 py-2 border border-navy rounded-md focus:ring-2 focus:ring-orange"
              value={vehicleType}
              onChange={e => setVehicleType(e.target.value)}
            >
              {vehicleTypes.map(v => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
            <input
              type="date"
              className="w-full md:w-40 px-3 py-2 border border-navy rounded-md focus:ring-2 focus:ring-orange"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
            <select
              className="w-full md:w-32 px-3 py-2 border border-navy rounded-md focus:ring-2 focus:ring-orange"
              value={duration}
              onChange={e => setDuration(e.target.value)}
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="8">8 hours</option>
              <option value="12">12 hours</option>
              <option value="24">1 day</option>
              <option value="48">2 days</option>
              <option value="168">1 week</option>
            </select>
            <button
              type="submit"
              className="bg-orange hover:bg-orange-dark text-white px-6 py-2 rounded-md font-semibold shadow transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Statistics Section */}
      <section className="container mx-auto px-4 py-16 bg-navy text-white">
        <h2 className="text-3xl font-bold text-center mb-12">Trucking Industry Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-orange mb-2">3.6M+</div>
            <p className="text-lg">US Truckers</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange mb-2">21%</div>
            <p className="text-lg">Truckers Reported Crime Last Year</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange mb-2">5</div>
            <p className="text-lg">Cargo Theft Incidents Per Day</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange mb-2">1:11</div>
            <p className="text-lg">Driver to Parking Spot Ratio</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8 text-navy">How TruckNest Works</h2>
        <div className="grid md:grid-cols-2 gap-12">
          {/* Property Members */}
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">🏡 For Property Members</h3>
            <ol className="list-decimal list-inside space-y-4 text-darkgray">
              <li>
                <span className="font-bold">Sign Up (Free):</span> Create a free account and list your land for truck parking.
              </li>
              <li>
                <span className="font-bold">Add Your Location:</span> Click "Become a Property Member," set up your listing, and watch our quick video guide if needed.
              </li>
              <li>
                <span className="font-bold">Accept Bookings:</span> Get instant email and text alerts when truckers book your space.
              </li>
            </ol>
          </div>
          {/* Truckers */}
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">🚛 For Truckers</h3>
            <ol className="list-decimal list-inside space-y-4 text-darkgray">
              <li>
                <span className="font-bold">Create Your Profile:</span> Sign up free and add your truck, trailer, and company info.
              </li>
              <li>
                <span className="font-bold">Find & Book Parking:</span> Reserve hourly, daily, weekly, or monthly spots wherever you need.
              </li>
              <li>
                <span className="font-bold">Park and Go:</span> Message your Property Member for help. For support, call <a href="tel:8888997275" className="text-orange font-semibold">(888) 899-7275</a> or visit our <Link href="#contact" className="text-orange font-semibold">Contact</Link> page.
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8 text-navy">Find Parking Near You</h2>
        <div className="bg-white rounded-lg shadow p-8">
          <Map
            markers={[
              {
                position: { lat: 40.7128, lng: -74.0060 },
                title: 'New York City Parking'
              },
              {
                position: { lat: 34.0522, lng: -118.2437 },
                title: 'Los Angeles Parking'
              },
              {
                position: { lat: 41.8781, lng: -87.6298 },
                title: 'Chicago Parking'
              }
            ]}
          />
          <div className="mt-4 text-center">
            <p className="text-darkgray mb-4">View available parking spots across the United States</p>
            <Link
              href="/booking"
              className="inline-block bg-orange hover:bg-orange-dark text-white px-6 py-2 rounded-md font-semibold shadow transition-colors"
            >
              Search Parking Spots
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Us Section Example */}
      <section id="contact" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8 text-navy">Contact Us</h2>
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-darkgray">Name</label>
              <input type="text" className="input-field w-full border border-navy" placeholder="Your Name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-darkgray">Email</label>
              <input type="email" className="input-field w-full border border-navy" placeholder="you@email.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-darkgray">Message</label>
              <textarea className="input-field w-full border border-navy" rows={4} placeholder="How can we help you?" required />
            </div>
            <button type="submit" className="bg-orange hover:bg-orange-dark text-white px-6 py-2 rounded-md font-semibold shadow transition-colors w-full">Send Message</button>
          </form>
        </div>
      </section>
    </div>
  )
}
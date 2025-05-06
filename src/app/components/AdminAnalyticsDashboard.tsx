'use client'

import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { db } from '@/app/config/firebase'
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface Booking {
  id: string;
  startDate: Timestamp;
  endDate: Timestamp;
  price: number;
  status: 'confirmed' | 'cancelled' | 'completed';
}

interface DashboardData {
  bookings: Booking[];
  revenue: number;
  occupancy: number;
}

export default function AdminAnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<DashboardData>({
    bookings: [],
    revenue: 0,
    occupancy: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const bookingsRef = collection(db, 'bookings')
      const q = query(
        bookingsRef,
        where('status', '==', 'completed')
      )
      const snapshot = await getDocs(q)
      
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[]

      setData({
        bookings,
        revenue: calculateRevenue(bookings),
        occupancy: calculateOccupancy(bookings)
      })
      setLoading(false)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setError('Failed to load analytics data')
      setLoading(false)
    }
  }

  const calculateRevenue = (bookings: Booking[]): number => {
    return bookings.reduce((total, booking) => total + booking.price, 0)
  }

  const calculateOccupancy = (bookings: Booking[]): number => {
    if (bookings.length === 0) return 0

    const now = new Date()
    const activeBookings = bookings.filter(booking => {
      const start = booking.startDate.toDate()
      const end = booking.endDate.toDate()
      return start <= now && end >= now
    })

    // Assuming you have a fixed number of parking spots
    const totalSpots = 100
    return (activeBookings.length / totalSpots) * 100
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Total Revenue</h2>
          <p className="text-3xl font-bold text-green-600">
            ${data.revenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Current Occupancy</h2>
          <p className="text-3xl font-bold text-blue-600">
            {data.occupancy.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Total Bookings</h2>
          <p className="text-3xl font-bold text-purple-600">
            {data.bookings.length}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.bookings.slice(0, 5).map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.startDate.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.endDate.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${booking.price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 
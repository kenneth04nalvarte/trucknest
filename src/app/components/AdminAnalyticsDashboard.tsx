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
import { db } from '@/config/firebase'
import { collection, query, getDocs, orderBy } from 'firebase/firestore'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function AdminAnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState({
    bookings: [],
    revenue: [],
    occupancy: []
  })

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const bookingsQuery = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(bookingsQuery)
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setData({
        bookings,
        revenue: calculateRevenue(bookings),
        occupancy: calculateOccupancy(bookings)
      })
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const calculateRevenue = (bookings: any[]) => {
    return bookings.reduce((acc, booking) => {
      return [...acc, booking.totalPrice || 0]
    }, [])
  }

  const calculateOccupancy = (bookings: any[]) => {
    return bookings.reduce((acc, booking) => {
      return [...acc, booking.spaces || 0]
    }, [])
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-md">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">Total Bookings</h3>
            <p className="text-2xl font-bold text-blue-600">{data.bookings.length}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-sm font-medium text-green-800">Total Revenue</h3>
            <p className="text-2xl font-bold text-green-600">
              ${data.revenue.reduce((a, b) => a + b, 0).toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800">Average Occupancy</h3>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(data.occupancy.reduce((a, b) => a + b, 0) / data.occupancy.length || 0)}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Revenue Trend</h3>
          <Line
            data={{
              labels: data.bookings.map((_, i) => `Day ${i + 1}`),
              datasets: [
                {
                  label: 'Revenue',
                  data: data.revenue,
                  borderColor: 'rgb(34, 197, 94)',
                  tension: 0.1
                }
              ]
            }}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Occupancy Trend</h3>
          <Line
            data={{
              labels: data.bookings.map((_, i) => `Day ${i + 1}`),
              datasets: [
                {
                  label: 'Occupancy %',
                  data: data.occupancy,
                  borderColor: 'rgb(99, 102, 241)',
                  tension: 0.1
                }
              ]
            }}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  )
} 
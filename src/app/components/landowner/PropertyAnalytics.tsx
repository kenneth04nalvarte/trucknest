'use client'

import { useState, useEffect } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { db } from '@/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { saveAs } from 'file-saver'
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface Booking {
  id: string
  propertyId: string
  startTime: Date
  endTime: Date
  vehicleType: string
  status: 'confirmed' | 'pending' | 'cancelled'
  totalPrice: number
}

interface VehicleTypeAnalytics {
  type: string
  totalBookings: number
  revenue: number
  averageStayDuration: number
}

interface HourlyAnalytics {
  hour: number
  bookings: number
  revenue: number
}

interface PropertyAnalyticsProps {
  propertyId: string
  basePrice: number
}

export default function PropertyAnalytics({ propertyId, basePrice }: PropertyAnalyticsProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [vehicleAnalytics, setVehicleAnalytics] = useState<VehicleTypeAnalytics[]>([])
  const [hourlyAnalytics, setHourlyAnalytics] = useState<HourlyAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month')
  const [pricingSuggestions, setPricingSuggestions] = useState<{
    basePrice: number
    peakHours: { hour: number; price: number }[]
    offPeakDiscount: number
  }>({
    basePrice: 0,
    peakHours: [],
    offPeakDiscount: 0
  })

  useEffect(() => {
    fetchAnalytics()
  }, [propertyId, dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)

      const now = new Date()
      let startDate: Date
      
      if (dateRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (dateRange === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      } else {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      }

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('propertyId', '==', propertyId),
        where('startTime', '>=', Timestamp.fromDate(startDate)),
        where('status', '==', 'confirmed'),
        orderBy('startTime', 'asc')
      )

      const snapshot = await getDocs(bookingsQuery)
      const bookingData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate()
      })) as Booking[]

      setBookings(bookingData)

      // Process vehicle type analytics
      const vehicleTypes = new Map<string, VehicleTypeAnalytics>()
      bookingData.forEach(booking => {
        const existing = vehicleTypes.get(booking.vehicleType) || {
          type: booking.vehicleType,
          totalBookings: 0,
          revenue: 0,
          averageStayDuration: 0
        }

        const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (60 * 60 * 1000)
        existing.totalBookings++
        existing.revenue += booking.totalPrice
        existing.averageStayDuration = (
          (existing.averageStayDuration * (existing.totalBookings - 1) + duration) /
          existing.totalBookings
        )

        vehicleTypes.set(booking.vehicleType, existing)
      })

      setVehicleAnalytics(Array.from(vehicleTypes.values()))

      // Process hourly analytics
      const hourlyData = new Array(24).fill(null).map((_, hour) => ({
        hour,
        bookings: 0,
        revenue: 0
      }))

      bookingData.forEach(booking => {
        const hour = booking.startTime.getHours()
        hourlyData[hour].bookings++
        hourlyData[hour].revenue += booking.totalPrice
      })

      setHourlyAnalytics(hourlyData)

      // Generate pricing suggestions
      const peakHours = hourlyData
        .filter(data => data.bookings > 0)
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 3)
        .map(data => ({
          hour: data.hour,
          price: Math.round(basePrice * 1.3) // 30% increase for peak hours
        }))

      const avgBookingsPerHour = hourlyData.reduce((sum, data) => sum + data.bookings, 0) / 24
      const offPeakDiscount = avgBookingsPerHour < 1 ? 20 : 10 // Higher discount if low utilization

      setPricingSuggestions({
        basePrice: Math.round(
          basePrice * (1 + (avgBookingsPerHour > 2 ? 0.15 : -0.1))
        ),
        peakHours,
        offPeakDiscount
      })

      setLoading(false)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load analytics')
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const data = bookings.map(booking => ({
      Date: booking.startTime.toLocaleDateString(),
      'Start Time': booking.startTime.toLocaleTimeString(),
      'End Time': booking.endTime.toLocaleTimeString(),
      'Vehicle Type': booking.vehicleType,
      'Total Price': booking.totalPrice,
      Status: booking.status
    }))

    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `bookings_${dateRange}_${new Date().toISOString()}.csv`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(16)
    doc.text('Property Analytics Report', 20, 20)

    // Add date range
    doc.setFontSize(12)
    doc.text(`Date Range: ${dateRange}`, 20, 30)

    // Add vehicle type analytics
    doc.text('Vehicle Type Analytics', 20, 45)
    const vehicleData = vehicleAnalytics.map(va => [
      va.type,
      va.totalBookings.toString(),
      `$${va.revenue.toFixed(2)}`,
      `${va.averageStayDuration.toFixed(1)} hours`
    ])
    
    doc.autoTable({
      head: [['Vehicle Type', 'Total Bookings', 'Revenue', 'Avg. Duration']],
      body: vehicleData,
      startY: 50
    })

    // Add pricing suggestions
    doc.text('Pricing Suggestions', 20, doc.autoTable.previous.finalY + 15)
    doc.text(`Suggested Base Price: $${pricingSuggestions.basePrice}`, 20, doc.autoTable.previous.finalY + 25)
    doc.text(`Off-Peak Discount: ${pricingSuggestions.offPeakDiscount}%`, 20, doc.autoTable.previous.finalY + 35)

    // Save the PDF
    doc.save(`analytics_${dateRange}_${new Date().toISOString()}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <button
            onClick={() => setDateRange('week')}
            className={`px-3 py-1 rounded ${
              dateRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-3 py-1 rounded ${
              dateRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setDateRange('year')}
            className={`px-3 py-1 rounded ${
              dateRange === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}
          >
            Year
          </button>
        </div>
        <div className="space-x-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export CSV
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Vehicle Type Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Vehicle Type Distribution</h3>
        <div className="h-80">
          <Bar
            data={{
              labels: vehicleAnalytics.map(va => va.type),
              datasets: [
                {
                  label: 'Total Bookings',
                  data: vehicleAnalytics.map(va => va.totalBookings),
                  backgroundColor: 'rgba(59, 130, 246, 0.5)'
                },
                {
                  label: 'Revenue ($)',
                  data: vehicleAnalytics.map(va => va.revenue),
                  backgroundColor: 'rgba(34, 197, 94, 0.5)'
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
      </div>

      {/* Hourly Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Hourly Distribution</h3>
        <div className="h-80">
          <Line
            data={{
              labels: hourlyAnalytics.map(ha => `${ha.hour}:00`),
              datasets: [
                {
                  label: 'Bookings',
                  data: hourlyAnalytics.map(ha => ha.bookings),
                  borderColor: 'rgb(59, 130, 246)',
                  tension: 0.1
                },
                {
                  label: 'Revenue ($)',
                  data: hourlyAnalytics.map(ha => ha.revenue),
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
      </div>

      {/* Pricing Suggestions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Pricing Suggestions</h3>
        <div className="space-y-4">
          <div>
            <p className="font-medium">Suggested Base Price</p>
            <p className="text-2xl text-blue-600">${pricingSuggestions.basePrice}</p>
            <p className="text-sm text-gray-500">
              Based on current demand and booking patterns
            </p>
          </div>
          <div>
            <p className="font-medium">Peak Hour Pricing</p>
            <div className="space-y-2">
              {pricingSuggestions.peakHours.map(peak => (
                <div key={peak.hour} className="flex items-center justify-between">
                  <span>{peak.hour}:00</span>
                  <span className="font-medium">${peak.price}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium">Off-Peak Discount</p>
            <p className="text-xl text-green-600">
              {pricingSuggestions.offPeakDiscount}% off
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 
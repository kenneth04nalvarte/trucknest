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
import { db } from '@/app/config/firebase'
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
import { useAuth } from '@/context/AuthContext'

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
  userId: string
}

interface VehicleTypeAnalytics {
  type: string
  totalBookings: number
  revenue: number
  averageStayDuration: number
  percentage: number
}

interface HourlyAnalytics {
  hour: number
  bookings: number
  revenue: number
  occupancyRate: number
}

interface PropertyAnalyticsProps {
  propertyId: string
  basePrice: number
  onError?: (error: Error) => void
  className?: string
}

interface Property {
  id: string
  name: string
  ownerId: string
  totalSpaces: number
}

interface AnalyticsData {
  bookings: Booking[]
  totalRevenue: number
  occupancyRate: number
  vehicleTypeDistribution: Record<string, number>
  hourlyAnalytics: HourlyAnalytics[]
  lastUpdated: Date
}

interface PricingSuggestion {
  basePrice: number
  peakHours: Array<{
    hour: number
    price: number
    reason: string
  }>
  offPeakDiscount: number
  confidence: number
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      head: string[][]
      body: string[][]
      theme?: string
      styles?: Record<string, unknown>
      headStyles?: Record<string, unknown>
      bodyStyles?: Record<string, unknown>
      startY?: number
    }) => jsPDF
  }
}

export default function PropertyAnalytics({ 
  propertyId, 
  basePrice, 
  onError,
  className 
}: PropertyAnalyticsProps) {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>(propertyId)
  const [data, setData] = useState<AnalyticsData>({
    bookings: [],
    totalRevenue: 0,
    occupancyRate: 0,
    vehicleTypeDistribution: {},
    hourlyAnalytics: [],
    lastUpdated: new Date()
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month')
  const [pricingSuggestions, setPricingSuggestions] = useState<PricingSuggestion>({
    basePrice: 0,
    peakHours: [],
    offPeakDiscount: 0,
    confidence: 0
  })

  useEffect(() => {
    if (!user) return
    fetchProperties()
  }, [user])

  useEffect(() => {
    if (selectedProperty) {
      fetchAnalytics()
    }
  }, [selectedProperty, dateRange])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      setError(null)

      const propertiesRef = collection(db, 'properties')
      const q = query(propertiesRef, where('ownerId', '==', user?.uid))
      const snapshot = await getDocs(q)
      
      const propertiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        totalSpaces: doc.data().totalSpaces || 100
      })) as Property[]
      
      setProperties(propertiesData)
      if (propertiesData.length > 0) {
        setSelectedProperty(propertiesData[0].id)
      }
    } catch (err) {
      const error = err as Error
      console.error('Error fetching properties:', error)
      setError('Failed to load properties')
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

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
        where('propertyId', '==', selectedProperty),
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

      const totalRevenue = bookingData.reduce((sum, booking) => sum + booking.totalPrice, 0)
      
      const vehicleTypeDistribution = bookingData.reduce((acc, booking) => {
        acc[booking.vehicleType] = (acc[booking.vehicleType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Calculate hourly analytics
      const hourlyAnalytics: HourlyAnalytics[] = Array.from({ length: 24 }, (_, hour) => {
        const hourBookings = bookingData.filter(booking => {
          const startHour = booking.startTime.getHours()
          const endHour = booking.endTime.getHours()
          return startHour <= hour && endHour > hour
        })

        return {
          hour,
          bookings: hourBookings.length,
          revenue: hourBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
          occupancyRate: (hourBookings.length / (properties.find(p => p.id === selectedProperty)?.totalSpaces || 100)) * 100
        }
      })

      // Calculate occupancy rate
      const activeBookings = bookingData.filter(booking => {
        const start = booking.startTime
        const end = booking.endTime
        return start <= now && end >= now
      })

      const selectedPropertyData = properties.find(p => p.id === selectedProperty)
      const totalSpots = selectedPropertyData?.totalSpaces || 100
      const occupancyRate = (activeBookings.length / totalSpots) * 100

      setData({
        bookings: bookingData,
        totalRevenue,
        occupancyRate,
        vehicleTypeDistribution,
        hourlyAnalytics,
        lastUpdated: new Date()
      })

      // Process vehicle type analytics
      const vehicleTypes = new Map<string, VehicleTypeAnalytics>()
      bookingData.forEach(booking => {
        const existing = vehicleTypes.get(booking.vehicleType) || {
          type: booking.vehicleType,
          totalBookings: 0,
          revenue: 0,
          averageStayDuration: 0,
          percentage: 0
        }

        const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (60 * 60 * 1000)
        existing.totalBookings++
        existing.revenue += booking.totalPrice
        existing.averageStayDuration = (
          (existing.averageStayDuration * (existing.totalBookings - 1) + duration) /
          existing.totalBookings
        )
        existing.percentage = (existing.totalBookings / bookingData.length) * 100

        vehicleTypes.set(booking.vehicleType, existing)
      })

      // Calculate pricing suggestions
      const peakHours = hourlyAnalytics
        .filter(hour => hour.occupancyRate > 70)
        .map(hour => ({
          hour: hour.hour,
          price: Math.round(basePrice * 1.2),
          reason: 'High occupancy rate'
        }))

      setPricingSuggestions({
        basePrice: Math.round(
          basePrice * (1 + (occupancyRate > 70 ? 0.15 : -0.1))
        ),
        peakHours,
        offPeakDiscount: occupancyRate < 30 ? 0.1 : 0,
        confidence: Math.min(occupancyRate / 100, 1)
      })

    } catch (err) {
      const error = err as Error
      console.error('Error fetching analytics:', error)
      setError('Failed to load analytics')
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const csvData = data.bookings.map(booking => ({
      ID: booking.id,
      'Vehicle Type': booking.vehicleType,
      'Start Date': booking.startTime.toLocaleDateString(),
      'End Date': booking.endTime.toLocaleDateString(),
      Price: booking.totalPrice,
      Status: booking.status,
      'User ID': booking.userId
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `property-analytics-${selectedProperty}.csv`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const property = properties.find(p => p.id === selectedProperty)

    doc.setFontSize(16)
    doc.text(`Property Analytics: ${property?.name || selectedProperty}`, 14, 20)

    doc.setFontSize(12)
    doc.text([
      `Total Revenue: $${data.totalRevenue.toFixed(2)}`,
      `Current Occupancy Rate: ${data.occupancyRate.toFixed(1)}%`,
      `Total Bookings: ${data.bookings.length}`,
    ], 14, 30)

    const vehicleData = Object.entries(data.vehicleTypeDistribution).map(([type, count]) => {
      const typeBookings = data.bookings.filter(b => b.vehicleType === type)
      const revenue = typeBookings.reduce((sum, b) => sum + b.totalPrice, 0)
      const avgDuration = typeBookings.reduce((sum, b) => {
        const duration = b.endTime.getTime() - b.startTime.getTime()
        return sum + duration
      }, 0) / (count * 86400000) // Convert to days

      return [
        type,
        count.toString(),
        `$${revenue.toFixed(2)}`,
        `${(avgDuration / 86400000).toFixed(1)} days`,
      ]
    })

    doc.autoTable({
      head: [['Vehicle Type', 'Total Bookings', 'Revenue', 'Avg. Duration']],
      body: vehicleData,
      startY: 50,
    })

    doc.save(`property-analytics-${selectedProperty}.pdf`)
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Property Analytics</h1>
        <div className="flex gap-4">
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export CSV
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Total Revenue</h2>
          <p className="text-3xl font-bold text-green-600">
            ${data.totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Current Occupancy</h2>
          <p className="text-3xl font-bold text-blue-600">
            {data.occupancyRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Total Bookings</h2>
          <p className="text-3xl font-bold text-purple-600">
            {data.bookings.length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Vehicle Type Distribution</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.vehicleTypeDistribution).map(([type, count]) => (
              <div key={type} className="border rounded-lg p-4">
                <h3 className="font-medium">{type}</h3>
                <p className="text-2xl font-bold text-gray-700">{count}</p>
                <p className="text-sm text-gray-500">
                  {((count / data.bookings.length) * 100).toFixed(1)}% of total
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { db } from '@/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore'

const locales = {
  'en-US': require('date-fns/locale/en-US')
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
})

interface Booking {
  id: string
  propertyId: string
  startTime: Date
  endTime: Date
  vehicleType: string
  status: 'confirmed' | 'pending' | 'cancelled'
  totalPrice: number
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  vehicleType: string
  status: Booking['status']
}

interface ReservationCalendarProps {
  propertyId: string
  totalSpaces: number
}

export default function ReservationCalendar({ propertyId, totalSpaces }: ReservationCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<'month' | 'week' | 'day'>('week')
  const [date, setDate] = useState(new Date())
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    fetchBookings()
  }, [propertyId, date, view])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      
      // Calculate view range
      let startDate: Date
      let endDate: Date
      
      if (view === 'month') {
        startDate = new Date(date.getFullYear(), date.getMonth(), 1)
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      } else if (view === 'week') {
        startDate = startOfWeek(date)
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 7)
      } else {
        startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)
      }

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('propertyId', '==', propertyId),
        where('startTime', '>=', Timestamp.fromDate(startDate)),
        where('endTime', '<=', Timestamp.fromDate(endDate))
      )

      const snapshot = await getDocs(bookingsQuery)
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate()
      })) as Booking[]

      // Convert bookings to calendar events
      const calendarEvents = bookings.map(booking => ({
        id: booking.id,
        title: `${booking.vehicleType} (${booking.status})`,
        start: booking.startTime,
        end: booking.endTime,
        vehicleType: booking.vehicleType,
        status: booking.status
      }))

      setEvents(calendarEvents)

      // Calculate availability for each hour
      const availability = new Map<string, number>()
      const hourMs = 60 * 60 * 1000
      
      for (let time = startDate.getTime(); time <= endDate.getTime(); time += hourMs) {
        const dateKey = new Date(time).toISOString()
        const activeBookings = bookings.filter(booking => 
          booking.startTime.getTime() <= time &&
          booking.endTime.getTime() > time &&
          booking.status === 'confirmed'
        )
        availability.set(dateKey, totalSpaces - activeBookings.length)
      }

      setAvailabilityMap(availability)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Failed to load bookings')
      setLoading(false)
    }
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3B82F6' // blue for confirmed
    if (event.status === 'pending') {
      backgroundColor = '#F59E0B' // yellow for pending
    } else if (event.status === 'cancelled') {
      backgroundColor = '#EF4444' // red for cancelled
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0',
        display: 'block'
      }
    }
  }

  const slotPropGetter = (date: Date) => {
    const dateKey = date.toISOString()
    const available = availabilityMap.get(dateKey) || 0
    const percentage = (available / totalSpaces) * 100

    let backgroundColor = '#f0fdf4' // green-50 for high availability
    if (percentage < 30) {
      backgroundColor = '#fef2f2' // red-50 for low availability
    } else if (percentage < 70) {
      backgroundColor = '#fefce8' // yellow-50 for medium availability
    }

    return {
      style: {
        backgroundColor
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 rounded ${
              view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1 rounded ${
              view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView('day')}
            className={`px-3 py-1 rounded ${
              view === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}
          >
            Day
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span className="text-sm">High Availability</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-100 rounded"></div>
            <span className="text-sm">Medium Availability</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 rounded"></div>
            <span className="text-sm">Low Availability</span>
          </div>
        </div>
      </div>

      <div className="h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={(newView: 'month' | 'week' | 'day') => setView(newView)}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          slotPropGetter={slotPropGetter}
          tooltipAccessor={event => `${event.vehicleType} - ${event.status}`}
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 
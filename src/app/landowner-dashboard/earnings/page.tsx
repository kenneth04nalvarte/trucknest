'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { Line } from 'react-chartjs-2'
import 'chart.js/auto'

const sidebarLinks = [
  { href: '/landowner-dashboard/properties', label: 'My Properties' },
  { href: '/landowner-dashboard/booking-requests', label: 'Booking Requests' },
  { href: '/landowner-dashboard/earnings', label: 'Earnings' },
  { href: '/landowner-dashboard/profile', label: 'Profile' },
]

export default function Earnings() {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState('month') // week, month, year
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [payouts, setPayouts] = useState<any[]>([])
  const [earningsData, setEarningsData] = useState<any[]>([])
  const [csvUrl, setCsvUrl] = useState('')
  // Filters
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [properties, setProperties] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    // Fetch properties for filter
    const fetchProperties = async () => {
      const q = query(collection(db, 'properties'), where('ownerId', '==', user.uid))
      const snapshot = await getDocs(q)
      setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }
    fetchProperties()
  }, [user])

  useEffect(() => {
    if (!user) return
    // Fetch all bookings for this landowner's properties
    const fetchEarnings = async () => {
      let bookingsQ = query(collection(db, 'bookings'), where('ownerId', '==', user.uid))
      const snapshot = await getDocs(bookingsQ)
      let sum = 0
      let data: any[] = []
      snapshot.forEach(doc => {
        const d = doc.data()
        if (propertyFilter === 'all' || d.propertyId === propertyFilter) {
          sum += d.totalPrice || 0
          data.push({ date: d.startDate?.toDate?.() || new Date(), amount: d.totalPrice || 0 })
        }
      })
      setTotalEarnings(sum)
      setEarningsData(data)
    }
    // Fetch payout history
    const fetchPayouts = async () => {
      const payoutsQ = query(collection(db, 'payouts'), where('ownerId', '==', user.uid))
      const snapshot = await getDocs(payoutsQ)
      setPayouts(snapshot.docs.map(doc => doc.data()))
    }
    fetchEarnings()
    fetchPayouts()
  }, [user, propertyFilter])

  // CSV Export
  useEffect(() => {
    if (!earningsData.length) return
    const csvRows = [
      ['Date', 'Amount'],
      ...earningsData.map(e => [e.date.toLocaleDateString(), e.amount])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n')
    setCsvUrl(encodeURI(csvContent))
  }, [earningsData])

  // Chart.js data
  const chartData = {
    labels: earningsData.map(e => e.date.toLocaleDateString()),
    datasets: [
      {
        label: 'Earnings',
        data: earningsData.map(e => e.amount),
        fill: false,
        borderColor: '#FFA500',
        tension: 0.1,
      },
    ],
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Earnings"
        sidebarLinks={sidebarLinks}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4 text-navy">Earnings Analytics</h1>
          <div className="mb-4 flex gap-4 items-center">
            <label className="font-semibold">Filter by Property:</label>
            <select value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)} className="border rounded px-2 py-1">
              <option value="all">All</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="bg-white rounded shadow p-4 mb-6">
            <div className="text-lg font-semibold mb-2">Total Earnings: <span className="text-green">${totalEarnings.toFixed(2)}</span></div>
            <Line data={chartData} />
          </div>
          <a href={csvUrl} download="earnings.csv" className="bg-orange text-white px-4 py-2 rounded mb-4 inline-block">Download CSV</a>
          <h2 className="text-xl font-semibold mb-2 mt-8 text-navy">Payout Management</h2>
          <div className="bg-white rounded shadow p-4">
            <div className="font-semibold mb-2">Payout History</div>
            <ul>
              {payouts.length === 0 ? <li>No payouts yet.</li> : payouts.map((p, i) => <li key={i}>{p.amount} on {p.date}</li>)}
            </ul>
            {/* TODO: Add payout request button */}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 
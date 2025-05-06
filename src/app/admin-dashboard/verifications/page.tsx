'use client'

import { useState } from 'react'
import AdminDashboardLayout from '../layout'

const mockVerifications = [
  { id: '1', type: 'User', name: 'Jane Doe', email: 'jane@example.com', status: 'pending' },
  { id: '2', type: 'Property', name: 'Main St Lot', owner: 'John Smith', status: 'pending' },
]

export default function VerificationsPage() {
  const [search, setSearch] = useState('')
  const [verifications, setVerifications] = useState(mockVerifications)

  const handleApprove = (id: string) => {
    setVerifications(vs => vs.map(v => v.id === id ? { ...v, status: 'approved' } : v))
  }
  const handleReject = (id: string) => {
    setVerifications(vs => vs.map(v => v.id === id ? { ...v, status: 'rejected' } : v))
  }

  const filtered = verifications.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.email && v.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <AdminDashboardLayout>
      <h1 className="text-3xl font-bold mb-6 text-navy">Verifications</h1>
      <p>Manage and review pending verifications here.</p>
      <div className="p-8">
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-4 px-3 py-2 border rounded w-full max-w-xs"
        />
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Owner/Email</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id} className="border-t">
                <td className="px-4 py-2">{v.type}</td>
                <td className="px-4 py-2">{v.name}</td>
                <td className="px-4 py-2">{v.owner || v.email}</td>
                <td className="px-4 py-2 capitalize">{v.status}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => handleApprove(v.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">Approve</button>
                  <button onClick={() => handleReject(v.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminDashboardLayout>
  )
} 
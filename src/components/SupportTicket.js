import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc
} from 'firebase/firestore'

interface Ticket {
  id: string
  title: string
  description: string
  status: 'open' | 'in-progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  userId: string
}

export default function SupportTicket() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewTicketForm, setShowNewTicketForm] = useState(false)
  const [newTicket, setNewTicket] = useState<Partial<Ticket>>({
    title: '',
    description: '',
    priority: 'medium'
  })

  useEffect(() => {
    if (user) {
      loadTickets()
    }
  }, [user])

  const loadTickets = async () => {
    try {
      const ticketsQuery = query(
        collection(db, 'supportTickets'),
        where('userId', '==', user?.uid)
      )
      const snapshot = await getDocs(ticketsQuery)
      const ticketsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[]
      setTickets(ticketsList)
      setLoading(false)
    } catch (err) {
      console.error('Error loading tickets:', err)
      setError('Failed to load support tickets')
      setLoading(false)
    }
  }

  const handleCreateTicket = async () => {
    try {
      const ticketData = {
        ...newTicket,
        userId: user?.uid,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      await addDoc(collection(db, 'supportTickets'), ticketData)
      setShowNewTicketForm(false)
      setNewTicket({
        title: '',
        description: '',
        priority: 'medium'
      })
      loadTickets()
    } catch (err) {
      console.error('Error creating ticket:', err)
      setError('Failed to create support ticket')
    }
  }

  const handleUpdateTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    try {
      const ticketRef = doc(db, 'supportTickets', ticketId)
      await updateDoc(ticketRef, {
        status,
        updatedAt: new Date().toISOString()
      })
      loadTickets()
    } catch (err) {
      console.error('Error updating ticket:', err)
      setError('Failed to update support ticket')
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
    <div className="space-y-6">
      {/* New Ticket Form */}
      {showNewTicketForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Support Ticket</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                rows={4}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as Ticket['priority'] })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNewTicketForm(false)}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">My Support Tickets</h2>
            <button
              onClick={() => setShowNewTicketForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              New Ticket
            </button>
          </div>
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No support tickets found.</p>
            ) : (
              tickets.map(ticket => (
                <div key={ticket.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{ticket.title}</h3>
                      <p className="text-sm text-gray-500">
                        Priority: {ticket.priority} • Status: {ticket.status}
                      </p>
                      <p className="mt-2 text-gray-600">{ticket.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      {ticket.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                          className="text-green-600 hover:text-green-800"
                        >
                          Mark as Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 
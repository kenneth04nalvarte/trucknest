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
  updateDoc,
  FirestoreError
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

type NewTicket = Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'status'>

export default function SupportTicket() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showNewTicketForm, setShowNewTicketForm] = useState(false)
  const [newTicket, setNewTicket] = useState<NewTicket>({
    title: '',
    description: '',
    priority: 'medium'
  })

  useEffect(() => {
    if (user?.uid) {
      loadTickets()
    }
  }, [user?.uid])

  const loadTickets = async () => {
    try {
      if (!user?.uid) return

      const ticketsQuery = query(
        collection(db, 'supportTickets'),
        where('userId', '==', user.uid)
      )
      const snapshot = await getDocs(ticketsQuery)
      const ticketsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[]
      setTickets(ticketsList)
      setLoading(false)
    } catch (err) {
      const error = err as FirestoreError
      console.error('Error loading tickets:', error)
      setError(`Failed to load support tickets: ${error.message}`)
      setLoading(false)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      if (!user?.uid) {
        setError('You must be logged in to create a ticket')
        return
      }

      const ticketData: Omit<Ticket, 'id'> = {
        ...newTicket,
        userId: user.uid,
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
      const error = err as FirestoreError
      console.error('Error creating ticket:', error)
      setError(`Failed to create support ticket: ${error.message}`)
    }
  }

  const handleUpdateTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    try {
      if (!user?.uid) {
        setError('You must be logged in to update a ticket')
        return
      }

      const ticketRef = doc(db, 'supportTickets', ticketId)
      await updateDoc(ticketRef, {
        status,
        updatedAt: new Date().toISOString()
      })
      loadTickets()
    } catch (err) {
      const error = err as FirestoreError
      console.error('Error updating ticket status:', error)
      setError(`Failed to update ticket status: ${error.message}`)
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
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as Ticket['priority'] })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNewTicketForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">My Support Tickets</h2>
          <button
            onClick={() => setShowNewTicketForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            New Ticket
          </button>
        </div>

        {tickets.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No support tickets found.</p>
        ) : (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{ticket.title}</h3>
                    <p className="text-sm text-gray-500">{ticket.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {ticket.status}
                    </span>
                    <button
                      onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                      className="px-2 py-1 text-xs text-green-600 hover:text-green-800"
                    >
                      Mark as Resolved
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 
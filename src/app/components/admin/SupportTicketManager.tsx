'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/config/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  onSnapshot
} from 'firebase/firestore'

interface Ticket {
  id: string
  userId: string
  subject: string
  description: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'booking' | 'payment' | 'technical' | 'other'
  assignedTo?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  messages: TicketMessage[]
}

interface TicketMessage {
  id: string
  ticketId: string
  userId: string
  message: string
  createdAt: Timestamp
  isStaff: boolean
}

export default function SupportTicketManager() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    category: 'all'
  })

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'supportTickets'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const ticketsData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data()
            
            // Get ticket messages
            const messagesQuery = query(
              collection(db, 'ticketMessages'),
              where('ticketId', '==', doc.id),
              orderBy('createdAt', 'asc')
            )
            const messagesSnap = await getDocs(messagesQuery)
            const messages = messagesSnap.docs.map(msgDoc => ({
              id: msgDoc.id,
              ...msgDoc.data()
            })) as TicketMessage[]

            return {
              id: doc.id,
              ...data,
              messages
            } as Ticket
          })
        )

        setTickets(ticketsData)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching tickets:', err)
        setError('Failed to load support tickets')
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [user])

  const handleStatusChange = async (ticketId: string, newStatus: Ticket['status']) => {
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        status: newStatus,
        updatedAt: Timestamp.now()
      })
    } catch (err) {
      console.error('Error updating ticket status:', err)
      setError('Failed to update ticket status')
    }
  }

  const handlePriorityChange = async (ticketId: string, newPriority: Ticket['priority']) => {
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        priority: newPriority,
        updatedAt: Timestamp.now()
      })
    } catch (err) {
      console.error('Error updating ticket priority:', err)
      setError('Failed to update ticket priority')
    }
  }

  const handleAssignment = async (ticketId: string, adminId: string) => {
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        assignedTo: adminId,
        updatedAt: Timestamp.now()
      })
    } catch (err) {
      console.error('Error assigning ticket:', err)
      setError('Failed to assign ticket')
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !user || !newMessage.trim()) {
      console.error('Missing required data:', { selectedTicket: !!selectedTicket, user: !!user, newMessage: !!newMessage.trim() })
      return
    }

    try {
      const messageData = {
        ticketId: selectedTicket.id,
        userId: user.uid,
        message: newMessage.trim(),
        createdAt: Timestamp.now(),
        isStaff: true
      }

      await addDoc(collection(db, 'ticketMessages'), messageData)
      setNewMessage('')
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    if (filter.status !== 'all' && ticket.status !== filter.status) return false
    if (filter.priority !== 'all' && ticket.priority !== filter.priority) return false
    if (filter.category !== 'all' && ticket.category !== filter.category) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Support Tickets</h2>
          
          {/* Filters */}
          <div className="mt-4 flex gap-4">
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="booking">Booking</option>
              <option value="payment">Payment</option>
              <option value="technical">Technical</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredTickets.map(ticket => (
            <div
              key={ticket.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 ${
                selectedTicket?.id === ticket.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{ticket.subject}</h3>
                  <p className="text-sm text-gray-500 mt-1">{ticket.description}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`
                    px-2 py-1 text-xs rounded-full
                    ${ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'}
                  `}>
                    {ticket.priority}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {ticket.createdAt.toDate().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Details */}
      {selectedTicket ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-medium text-gray-900">{selectedTicket.subject}</h2>
              <select
                value={selectedTicket.status}
                onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as Ticket['status'])}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="mt-4 flex gap-4">
              <select
                value={selectedTicket.priority}
                onChange={(e) => handlePriorityChange(selectedTicket.id, e.target.value as Ticket['priority'])}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>

              <select
                value={selectedTicket.assignedTo || ''}
                onChange={(e) => handleAssignment(selectedTicket.id, e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">Unassigned</option>
                {/* Add admin users here */}
              </select>
            </div>
          </div>

          <div className="p-4 h-96 overflow-y-auto">
            {selectedTicket.messages.map(message => (
              <div
                key={message.id}
                className={`mb-4 ${message.isStaff ? 'text-right' : ''}`}
              >
                <div
                  className={`inline-block rounded-lg px-4 py-2 max-w-xs ${
                    message.isStaff
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <span className="text-xs text-gray-500 mt-1">
                    {message.createdAt.toDate().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-center">Select a ticket to view details</p>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 
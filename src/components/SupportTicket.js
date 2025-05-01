import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';

const SupportTicket = () => {
    const [tickets, setTickets] = useState([]);
    const [showNewTicketForm, setShowNewTicketForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        type: 'general',
        subject: '',
        description: '',
        priority: 'normal',
        bookingId: '',
    });

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            const ticketsQuery = query(
                collection(db, 'supportTickets'),
                where('userId', '==', auth.currentUser.uid),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(ticketsQuery);
            const ticketsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTickets(ticketsList);
            setLoading(false);
        } catch (err) {
            console.error('Error loading tickets:', err);
            setError('Failed to load support tickets');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const ticketData = {
                ...formData,
                userId: auth.currentUser.uid,
                userEmail: auth.currentUser.email,
                status: 'open',
                createdAt: new Date().toISOString(),
                updates: [],
                escalated: false
            };

            await addDoc(collection(db, 'supportTickets'), ticketData);
            setShowNewTicketForm(false);
            setFormData({
                type: 'general',
                subject: '',
                description: '',
                priority: 'normal',
                bookingId: ''
            });
            await loadTickets();
            setError(null);
        } catch (err) {
            console.error('Error creating ticket:', err);
            setError('Failed to create support ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleEscalate = async (ticketId) => {
        try {
            const ticketRef = doc(db, 'supportTickets', ticketId);
            await updateDoc(ticketRef, {
                escalated: true,
                status: 'escalated',
                updatedAt: new Date().toISOString()
            });
            await loadTickets();
        } catch (err) {
            console.error('Error escalating ticket:', err);
            setError('Failed to escalate ticket');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center p-4">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Support & Disputes</h2>
                <button
                    onClick={() => setShowNewTicketForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    New Support Ticket
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                    {error}
                </div>
            )}

            {showNewTicketForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Create Support Ticket</h3>
                            <button
                                onClick={() => setShowNewTicketForm(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                >
                                    <option value="general">General Support</option>
                                    <option value="payment">Payment Dispute</option>
                                    <option value="booking">Booking Issue</option>
                                    <option value="technical">Technical Support</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows="4"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Related Booking ID (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.bookingId}
                                    onChange={(e) => setFormData({...formData, bookingId: e.target.value})}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewTicketForm(false)}
                                    className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Submit Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tickets List */}
            <div className="space-y-4">
                {tickets.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No support tickets found.</p>
                ) : (
                    tickets.map(ticket => (
                        <div key={ticket.id} className="bg-white rounded-lg shadow p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                                    <p className="text-sm text-gray-600">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                                        ${ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                                        ticket.status === 'escalated' ? 'bg-yellow-100 text-yellow-800' :
                                        ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                        'bg-blue-100 text-blue-800'}`}>
                                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                                        ${ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                        ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                        ticket.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'}`}>
                                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                    </span>
                                </div>
                            </div>
                            <p className="text-gray-700">{ticket.description}</p>
                            {ticket.bookingId && (
                                <p className="text-sm text-gray-600">Booking ID: {ticket.bookingId}</p>
                            )}
                            {!ticket.escalated && ticket.status !== 'closed' && (
                                <button
                                    onClick={() => handleEscalate(ticket.id)}
                                    className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
                                >
                                    Escalate Issue
                                </button>
                            )}
                            {ticket.updates && ticket.updates.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <h4 className="font-medium text-gray-900">Updates</h4>
                                    {ticket.updates.map((update, index) => (
                                        <div key={index} className="bg-gray-50 p-3 rounded">
                                            <p className="text-sm text-gray-700">{update.message}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(update.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SupportTicket; 
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  userId: string;
}

const SupportTicketManager: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: '1',
      subject: 'Payment Issue',
      message: 'Unable to process payment for parking spot',
      status: 'open',
      priority: 'high',
      createdAt: '2024-05-01',
      userId: 'user123',
    },
  ]);

  if (!user) {
    return <div>Please sign in to access this feature.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Support Ticket Management</h2>
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="p-4 border rounded"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{ticket.subject}</h3>
                <p className="text-gray-600">{ticket.message}</p>
                <div className="mt-2 space-x-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                    ticket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {ticket.status}
                  </span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                    ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {ticket.priority}
                  </span>
                </div>
                <span className="text-sm text-gray-500 block mt-2">{ticket.createdAt}</span>
              </div>
              <div className="space-x-2">
                <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Update Status
                </button>
                <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                  Close Ticket
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupportTicketManager; 
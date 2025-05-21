'use client';

import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface ContactFormProps {
  propertyId: string;
}

export default function ContactForm({ propertyId }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      await addDoc(collection(db, 'propertyInquiries'), {
        ...formData,
        propertyId,
        createdAt: new Date(),
        status: 'new',
      });
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/Parking%20Trucks.png)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50 z-0" />
      <div className="relative z-10 p-8 rounded-lg max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
              placeholder="(555) 555-5555"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
              placeholder="I'm interested in parking my truck at your location..."
            />
          </div>

          {status === 'success' && (
            <div className="p-3 bg-green-100 text-green-700 rounded-md">
              Message sent successfully! The property owner will contact you soon.
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md">
              Failed to send message. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className={`w-full bg-orange text-white py-2 px-4 rounded-md hover:bg-orange-dark transition-colors ${
              status === 'loading' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {status === 'loading' ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface Property {
  id: string;
  name: string;
  address: string;
  ownerId: string;
}

interface PropertyVerificationTableProps {
  initialProperties: Property[];
}

export default function PropertyVerificationTable({ initialProperties }: PropertyVerificationTableProps) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'properties', id), { status });
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error updating property status:', error);
      alert('Failed to update property status. Please try again.');
    }
  };

  return (
    <table className="w-full text-left">
      <thead>
        <tr>
          <th className="p-2">Name</th>
          <th className="p-2">Address</th>
          <th className="p-2">Owner</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {properties.length === 0 ? (
          <tr>
            <td colSpan={4} className="p-2 text-center text-gray-500">
              No properties pending verification.
            </td>
          </tr>
        ) : properties.map(p => (
          <tr key={p.id} className="border-t hover:bg-gray-50">
            <td className="p-2">{p.name}</td>
            <td className="p-2">{p.address}</td>
            <td className="p-2">{p.ownerId}</td>
            <td className="p-2">
              <button 
                className="text-green-600 mr-2 hover:text-green-700 transition-colors"
                onClick={() => updateStatus(p.id, 'approved')}
              >
                Approve
              </button>
              <button 
                className="text-red-600 hover:text-red-700 transition-colors"
                onClick={() => updateStatus(p.id, 'rejected')}
              >
                Reject
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
} 
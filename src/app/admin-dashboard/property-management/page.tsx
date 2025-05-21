'use client'

import { useState, useEffect } from 'react'
import AdminDashboardLayout from '../layout'
import { collection, getDocs, updateDoc, doc, addDoc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'

type Property = {
  id: string;
  name?: string;
  address?: string;
  status: string;
  // Add other fields as needed
}

export default function PropertyManagementPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const propertiesRef = collection(db, 'properties')
        const snapshot = await getDocs(propertiesRef)
        const propertiesList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name ?? '',
            address: data.address ?? '',
            status: data.status ?? 'pending',
            // Add other fields as needed, with defaults if required
          };
        })
        setProperties(propertiesList)
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

  const handleApprove = async (propertyId: string) => {
    await updateDoc(doc(db, 'properties', propertyId), { status: 'active' })
    setProperties(props => props.map(p => p.id === propertyId ? { ...p, status: 'active' } : p))
    // Fetch property to get ownerId and address
    const propertyDoc = await getDoc(doc(db, 'properties', propertyId))
    const property = propertyDoc.data()
    if (property) {
      await addDoc(collection(db, 'notifications'), {
        userId: property.ownerId,
        propertyId,
        propertyAddress: property.address,
        type: 'property_approved',
        status: 'unread',
        message: `Your property at ${property.address} has been approved and is now live!`,
        createdAt: new Date(),
      })
    }
  }

  const handleReject = async (propertyId: string) => {
    await updateDoc(doc(db, 'properties', propertyId), { status: 'rejected' })
    setProperties(props => props.map(p => p.id === propertyId ? { ...p, status: 'rejected' } : p))
    // Fetch property to get ownerId and address
    const propertyDoc = await getDoc(doc(db, 'properties', propertyId))
    const property = propertyDoc.data()
    if (property) {
      await addDoc(collection(db, 'notifications'), {
        userId: property.ownerId,
        propertyId,
        propertyAddress: property.address,
        type: 'property_rejected',
        status: 'unread',
        message: `Your property at ${property.address} was rejected. Please review and resubmit.`,
        createdAt: new Date(),
      })
    }
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">Property Management</h1>
        
        {loading ? (
          <p>Loading properties...</p>
        ) : (
          <div className="grid gap-6">
            {properties.length === 0 ? (
              <p>No properties found.</p>
            ) : (
              properties.map((property) => (
                <div key={property.id} className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold text-navy">{property.name}</h2>
                  <p className="text-gray-600">{property.address}</p>
                  <div className="mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      property.status === 'active' ? 'bg-green-100 text-green-800' :
                      property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {property.status}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-4">
                    <button className="bg-navy text-white px-4 py-2 rounded hover:bg-navy-dark">
                      View Details
                    </button>
                    <button className="bg-orange text-white px-4 py-2 rounded hover:bg-orange-dark">
                      Edit
                    </button>
                    {property.status === 'pending' && (
                      <>
                        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={() => handleApprove(property.id)}>
                          Approve
                        </button>
                        <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={() => handleReject(property.id)}>
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  )
} 
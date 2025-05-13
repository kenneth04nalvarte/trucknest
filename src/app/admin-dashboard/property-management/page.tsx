'use client'

import { useState, useEffect } from 'react'
import AdminDashboardLayout from '../layout'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/config/firebase'

export default function PropertyManagementPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const propertiesRef = collection(db, 'properties')
        const snapshot = await getDocs(propertiesRef)
        const propertiesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setProperties(propertiesList)
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

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
                  <div className="mt-4 flex gap-4">
                    <button className="bg-navy text-white px-4 py-2 rounded hover:bg-navy-dark">
                      View Details
                    </button>
                    <button className="bg-orange text-white px-4 py-2 rounded hover:bg-orange-dark">
                      Edit
                    </button>
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
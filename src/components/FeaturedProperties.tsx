'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Property {
  id: string
  title: string
  description: string
  price: number
  location: string
  imageUrl: string
  rating: number
}

export default function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        const propertiesRef = collection(db, 'properties')
        const q = query(
          propertiesRef,
          where('status', '==', 'active'),
          where('featured', '==', true),
          limit(3)
        )
        const querySnapshot = await getDocs(q)
        const propertiesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Property[]
        setProperties(propertiesData)
      } catch (error) {
        console.error('Error fetching featured properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProperties()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-navy mb-12">
          Featured Parking Spots
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/properties/${property.id}`}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <div className="relative h-48">
                  <img
                    src={property.imageUrl}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full text-sm font-semibold text-orange">
                    ${property.price}/day
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-navy mb-2">
                    {property.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {property.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 text-gray-600">{property.rating}</span>
                    </div>
                    <span className="text-gray-600">{property.location}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/properties"
            className="inline-block bg-orange hover:bg-orange-dark text-white px-6 py-3 rounded-md text-lg font-semibold shadow transition-colors"
          >
            View All Properties
          </Link>
        </div>
      </div>
    </section>
  )
} 
import { db } from '@/app/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';

interface Property {
  id: string;
  name?: string;
  address?: string;
  images?: string[];
  pricePerDay?: number;
  availableSpaces?: number;
  amenities?: string[];
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const location = searchParams.location as string;
  const date = searchParams.date as string;

  // Fetch properties from Firestore
  const propertiesRef = collection(db, 'properties');
  let q = query(propertiesRef, where('status', '==', 'active'));

  // Add location filter if provided
  if (location) {
    q = query(q, where('city', '==', location));
  }

  const propertiesSnapshot = await getDocs(q);
  const properties: Property[] = propertiesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Search Results</h1>
      
      {properties.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-700">No properties found</h2>
          <p className="text-gray-500 mt-2">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link 
              href={`/properties/${property.id}`}
              key={property.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative h-48">
                <Image
                  src={property.images?.[0] || '/placeholder.jpg'}
                  alt={property.name || 'Property image'}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{property.name}</h2>
                <p className="text-gray-600 mb-2">{property.address}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">
                    ${property.pricePerDay}/day
                  </span>
                  <span className="text-sm text-gray-500">
                    {property.availableSpaces} spaces available
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(property.amenities ?? []).slice(0, 3).map((amenity: string) => (
                    <span
                      key={amenity}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 
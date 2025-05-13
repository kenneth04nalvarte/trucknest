import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Property {
  id: string;
  name: string;
  address: string;
  totalSpots: number;
  availableSpots: number;
  pricePerDay: number;
  amenities: string[];
}

const PropertyManager: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([
    {
      id: '1',
      name: 'Downtown Truck Lot',
      address: '123 Main St, City, State',
      totalSpots: 50,
      availableSpots: 30,
      pricePerDay: 75,
      amenities: ['Security', 'Lighting', 'Restrooms'],
    },
  ]);

  if (!user) {
    return <div>Please sign in to access this feature.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Property Management</h2>
      <div className="space-y-4">
        {properties.map((property) => (
          <div
            key={property.id}
            className="p-4 border rounded shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-lg">{property.name}</h3>
                <p className="text-gray-600">{property.address}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm text-gray-500">Total Spots:</span>
                    <span className="ml-1 font-medium">{property.totalSpots}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Available:</span>
                    <span className="ml-1 font-medium">{property.availableSpots}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Price/Day:</span>
                    <span className="ml-1 font-medium">${property.pricePerDay}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-500">Amenities:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {property.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-x-2">
                <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Edit
                </button>
                <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Add New Property
        </button>
      </div>
    </div>
  );
};

export default PropertyManager; 
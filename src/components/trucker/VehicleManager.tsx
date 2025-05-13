'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/app/config/firebase';
import { useAuth } from '@/context/AuthContext';

interface Vehicle {
  id: string;
  type: 'semi' | 'van' | 'box_truck' | 'other';
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  height: number;
  width: number;
  length: number;
  weight: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function VehicleManager() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    type: 'semi',
    licensePlate: '',
    make: '',
    model: '',
    year: 0,
    height: 0,
    width: 0,
    length: 0,
    weight: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchVehicles = async () => {
      try {
        const vehiclesRef = collection(db, 'vehicles');
        const q = query(vehiclesRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const vehiclesData: Vehicle[] = [];
        querySnapshot.forEach((doc) => {
          vehiclesData.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate(),
          } as Vehicle);
        });

        setVehicles(vehiclesData);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        setError('Failed to load vehicles');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [user]);

  const handleAddVehicle = async () => {
    if (!user) return;

    try {
      const vehicleData: Omit<Vehicle, 'id'> = {
        type: newVehicle.type as Vehicle['type'],
        licensePlate: newVehicle.licensePlate || '',
        make: newVehicle.make || '',
        model: newVehicle.model || '',
        year: newVehicle.year || 0,
        height: newVehicle.height || 0,
        width: newVehicle.width || 0,
        length: newVehicle.length || 0,
        weight: newVehicle.weight || 0,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = doc(collection(db, 'vehicles'));
      await setDoc(docRef, vehicleData);

      setVehicles([
        ...vehicles,
        {
          id: docRef.id,
          ...vehicleData,
        },
      ]);

      // Reset form
      setNewVehicle({
        type: 'semi',
        licensePlate: '',
        make: '',
        model: '',
        year: 0,
        height: 0,
        width: 0,
        length: 0,
        weight: 0,
      });
    } catch (error) {
      console.error('Error adding vehicle:', error);
      setError('Failed to add vehicle');
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      await deleteDoc(doc(db, 'vehicles', vehicleId));
      setVehicles(vehicles.filter((vehicle) => vehicle.id !== vehicleId));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      setError('Failed to delete vehicle');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Vehicle Manager</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Add New Vehicle</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={newVehicle.type}
                onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value as Vehicle['type'] })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="semi">Semi Truck</option>
                <option value="van">Van</option>
                <option value="box_truck">Box Truck</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">License Plate</label>
              <input
                type="text"
                value={newVehicle.licensePlate}
                onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Make</label>
                <input
                  type="text"
                  value={newVehicle.make}
                  onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <input
                  type="text"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <input
                type="number"
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Height (m)</label>
                <input
                  type="number"
                  value={newVehicle.height}
                  onChange={(e) => setNewVehicle({ ...newVehicle, height: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Width (m)</label>
                <input
                  type="number"
                  value={newVehicle.width}
                  onChange={(e) => setNewVehicle({ ...newVehicle, width: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Length (m)</label>
                <input
                  type="number"
                  value={newVehicle.length}
                  onChange={(e) => setNewVehicle({ ...newVehicle, length: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                <input
                  type="number"
                  value={newVehicle.weight}
                  onChange={(e) => setNewVehicle({ ...newVehicle, weight: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddVehicle}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Vehicle
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Vehicles</h2>
          {vehicles.length === 0 ? (
            <p className="text-gray-500">No vehicles added yet</p>
          ) : (
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-white p-4 rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {vehicle.make} {vehicle.model} ({vehicle.type})
                      </h3>
                      <p className="text-gray-600">License Plate: {vehicle.licensePlate}</p>
                      <p className="text-gray-600">Year: {vehicle.year}</p>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Dimensions: {vehicle.length}m × {vehicle.width}m × {vehicle.height}m</p>
                        <p>Weight: {vehicle.weight}kg</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
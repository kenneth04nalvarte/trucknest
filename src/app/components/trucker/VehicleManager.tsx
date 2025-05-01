'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore'

interface Vehicle {
  id: string
  userId: string
  name: string
  type: 'semi' | 'box_truck' | 'van' | 'other'
  licensePlate: string
  length: number
  height: number
  weight: number
  isDefault: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export default function VehicleManager() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    type: 'semi' as const,
    licensePlate: '',
    length: 0,
    height: 0,
    weight: 0,
    isDefault: false
  })

  useEffect(() => {
    if (!user) return
    loadVehicles()
  }, [user])

  const loadVehicles = async () => {
    try {
      const vehiclesQuery = query(
        collection(db, 'vehicles'),
        where('userId', '==', user?.uid)
      )
      const snapshot = await getDocs(vehiclesQuery)
      const vehiclesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[]
      setVehicles(vehiclesData)
      setLoading(false)
    } catch (err) {
      console.error('Error loading vehicles:', err)
      setError('Failed to load vehicles')
      setLoading(false)
    }
  }

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      // If this is the first vehicle or marked as default, unset other defaults
      if (newVehicle.isDefault || vehicles.length === 0) {
        for (const vehicle of vehicles) {
          if (vehicle.isDefault) {
            await updateDoc(doc(db, 'vehicles', vehicle.id), {
              isDefault: false,
              updatedAt: Timestamp.now()
            })
          }
        }
      }

      await addDoc(collection(db, 'vehicles'), {
        ...newVehicle,
        userId: user.uid,
        isDefault: newVehicle.isDefault || vehicles.length === 0, // First vehicle is default
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })

      setNewVehicle({
        name: '',
        type: 'semi',
        licensePlate: '',
        length: 0,
        height: 0,
        weight: 0,
        isDefault: false
      })

      loadVehicles()
    } catch (err) {
      console.error('Error adding vehicle:', err)
      setError('Failed to add vehicle')
    }
  }

  const handleSetDefault = async (vehicleId: string) => {
    try {
      // Unset current default
      const currentDefault = vehicles.find(v => v.isDefault)
      if (currentDefault) {
        await updateDoc(doc(db, 'vehicles', currentDefault.id), {
          isDefault: false,
          updatedAt: Timestamp.now()
        })
      }

      // Set new default
      await updateDoc(doc(db, 'vehicles', vehicleId), {
        isDefault: true,
        updatedAt: Timestamp.now()
      })

      loadVehicles()
    } catch (err) {
      console.error('Error setting default vehicle:', err)
      setError('Failed to set default vehicle')
    }
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      await deleteDoc(doc(db, 'vehicles', vehicleId))
      loadVehicles()
    } catch (err) {
      console.error('Error deleting vehicle:', err)
      setError('Failed to delete vehicle')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Vehicle Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Vehicle</h2>
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Vehicle Name</label>
              <input
                type="text"
                value={newVehicle.name}
                onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                placeholder="e.g., My Semi Truck"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
              <select
                value={newVehicle.type}
                onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value as Vehicle['type'] })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                required
              >
                <option value="semi">Semi Truck</option>
                <option value="box_truck">Box Truck</option>
                <option value="van">Van</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">License Plate</label>
              <input
                type="text"
                value={newVehicle.licensePlate}
                onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                placeholder="License plate number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Length (feet)</label>
              <input
                type="number"
                value={newVehicle.length || ''}
                onChange={(e) => setNewVehicle({ ...newVehicle, length: parseFloat(e.target.value) })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                placeholder="Vehicle length"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Height (feet)</label>
              <input
                type="number"
                value={newVehicle.height || ''}
                onChange={(e) => setNewVehicle({ ...newVehicle, height: parseFloat(e.target.value) })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                placeholder="Vehicle height"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Weight (lbs)</label>
              <input
                type="number"
                value={newVehicle.weight || ''}
                onChange={(e) => setNewVehicle({ ...newVehicle, weight: parseFloat(e.target.value) })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                placeholder="Vehicle weight"
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={newVehicle.isDefault}
              onChange={(e) => setNewVehicle({ ...newVehicle, isDefault: e.target.checked })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
              Set as default vehicle
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Add Vehicle
          </button>
        </form>
      </div>

      {/* Vehicles List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">My Vehicles</h2>
          <div className="space-y-4">
            {vehicles.map(vehicle => (
              <div
                key={vehicle.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">{vehicle.name}</h3>
                    {vehicle.isDefault && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {vehicle.type} • {vehicle.licensePlate}
                  </p>
                  <p className="text-sm text-gray-500">
                    {vehicle.length}' x {vehicle.height}' • {vehicle.weight} lbs
                  </p>
                </div>
                <div className="flex space-x-2">
                  {!vehicle.isDefault && (
                    <button
                      onClick={() => handleSetDefault(vehicle.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {vehicles.length === 0 && (
              <p className="text-gray-500 text-center">No vehicles added yet</p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 
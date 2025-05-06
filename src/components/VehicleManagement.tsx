import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/app/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  FirestoreError,
  WriteBatch,
  writeBatch
} from 'firebase/firestore'

interface Vehicle {
  id: string
  name: string
  type: 'semi' | 'box_truck' | 'van' | 'other'
  length: number
  height: number
  weight: number
  isDefault: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

type NewVehicle = Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

export default function VehicleManagement() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVehicle, setNewVehicle] = useState<NewVehicle>({
    name: '',
    type: 'other',
    length: 0,
    height: 0,
    weight: 0,
    isDefault: false
  })

  useEffect(() => {
    if (user?.uid) {
      loadVehicles()
    }
  }, [user?.uid])

  const loadVehicles = async () => {
    try {
      if (!user?.uid) return

      const vehiclesQuery = query(
        collection(db, 'vehicles'),
        where('userId', '==', user.uid)
      )
      const snapshot = await getDocs(vehiclesQuery)
      const vehiclesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[]
      setVehicles(vehiclesList)
      setLoading(false)
    } catch (err) {
      const error = err as FirestoreError
      console.error('Error loading vehicles:', error)
      setError(`Failed to load vehicles: ${error.message}`)
      setLoading(false)
    }
  }

  const handleAddVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      if (!user?.uid) {
        setError('You must be logged in to add a vehicle')
        return
      }

      const vehicleData: Omit<Vehicle, 'id'> = {
        ...newVehicle,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      await addDoc(collection(db, 'vehicles'), vehicleData)
      setShowAddForm(false)
      setNewVehicle({
        name: '',
        type: 'other',
        length: 0,
        height: 0,
        weight: 0,
        isDefault: false
      })
      loadVehicles()
    } catch (err) {
      const error = err as FirestoreError
      console.error('Error adding vehicle:', error)
      setError(`Failed to add vehicle: ${error.message}`)
    }
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      if (!user?.uid) {
        setError('You must be logged in to delete a vehicle')
        return
      }

      const vehicle = vehicles.find(v => v.id === vehicleId)
      if (!vehicle) {
        setError('Vehicle not found')
        return
      }

      await deleteDoc(doc(db, 'vehicles', vehicleId))
      
      // If the deleted vehicle was default, make another one default
      if (vehicle.isDefault && vehicles.length > 1) {
        const nextVehicle = vehicles.find(v => v.id !== vehicleId)
        if (nextVehicle) {
          await updateDoc(doc(db, 'vehicles', nextVehicle.id), { 
            isDefault: true,
            updatedAt: new Date().toISOString()
          })
        }
      }
      
      loadVehicles()
    } catch (err) {
      const error = err as FirestoreError
      console.error('Error deleting vehicle:', error)
      setError(`Failed to delete vehicle: ${error.message}`)
    }
  }

  const handleSetDefault = async (vehicleId: string) => {
    try {
      if (!user?.uid) {
        setError('You must be logged in to set a default vehicle')
        return
      }

      const batch = writeBatch(db)
      
      // First, set all vehicles to non-default
      vehicles.forEach(vehicle => {
        const vehicleRef = doc(db, 'vehicles', vehicle.id)
        batch.update(vehicleRef, { 
          isDefault: false,
          updatedAt: new Date().toISOString()
        })
      })
      
      // Then set the selected vehicle as default
      const selectedVehicleRef = doc(db, 'vehicles', vehicleId)
      batch.update(selectedVehicleRef, { 
        isDefault: true,
        updatedAt: new Date().toISOString()
      })
      
      await batch.commit()
      loadVehicles()
    } catch (err) {
      const error = err as FirestoreError
      console.error('Error setting default vehicle:', error)
      setError(`Failed to set default vehicle: ${error.message}`)
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
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Vehicle</h2>
          <form onSubmit={handleAddVehicle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={newVehicle.name}
                onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <input
                type="text"
                value={newVehicle.type}
                onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value as 'semi' | 'box_truck' | 'van' | 'other' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Length (ft)</label>
              <input
                type="number"
                value={newVehicle.length}
                onChange={(e) => setNewVehicle({ ...newVehicle, length: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Height (ft)</label>
              <input
                type="number"
                value={newVehicle.height}
                onChange={(e) => setNewVehicle({ ...newVehicle, height: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Weight (lbs)</label>
              <input
                type="number"
                value={newVehicle.weight}
                onChange={(e) => setNewVehicle({ ...newVehicle, weight: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newVehicle.isDefault}
                onChange={(e) => setNewVehicle({ ...newVehicle, isDefault: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Set as default vehicle</label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Vehicle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicles List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">My Vehicles</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Vehicle
          </button>
        </div>

        {vehicles.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No vehicles found.</p>
        ) : (
          <div className="space-y-4">
            {vehicles.map(vehicle => (
              <div key={vehicle.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{vehicle.name}</h3>
                    <p className="text-sm text-gray-500">
                      Type: {vehicle.type} • Length: {vehicle.length}ft • Height: {vehicle.height}ft • Weight: {vehicle.weight}lbs
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {vehicle.isDefault ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(vehicle.id)}
                        className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 
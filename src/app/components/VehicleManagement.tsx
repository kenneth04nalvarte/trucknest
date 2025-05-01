'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
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
  type: string
  make: string
  model: string
  year: string
  licensePlate: string
  vin: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface VehicleFormData {
  type: string
  make: string
  model: string
  year: string
  licensePlate: string
  vin: string
}

export default function VehicleManagement() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAddingVehicle, setIsAddingVehicle] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null)
  const [formData, setFormData] = useState<VehicleFormData>({
    type: 'semi',
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    vin: '',
  })

  useEffect(() => {
    if (user) {
      loadVehicles()
    }
  }, [user])

  const loadVehicles = async () => {
    try {
      const vehiclesQuery = query(
        collection(db, 'vehicles'),
        where('userId', '==', user?.uid)
      )
      const snapshot = await getDocs(vehiclesQuery)
      const vehiclesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[]
      setVehicles(vehiclesList)
    } catch (error) {
      console.error('Error loading vehicles:', error)
      setError('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      type: 'semi',
      make: '',
      model: '',
      year: '',
      licensePlate: '',
      vin: '',
    })
    setIsAddingVehicle(false)
    setEditingVehicle(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (editingVehicle) {
        // Update existing vehicle
        const vehicleRef = doc(db, 'vehicles', editingVehicle)
        await updateDoc(vehicleRef, {
          ...formData,
          updatedAt: Timestamp.now()
        })
      } else {
        // Add new vehicle
        await addDoc(collection(db, 'vehicles'), {
          ...formData,
          userId: user?.uid,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      }

      await loadVehicles()
      resetForm()
    } catch (error) {
      console.error('Error saving vehicle:', error)
      setError('Failed to save vehicle')
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    setFormData({
      type: vehicle.type,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      vin: vehicle.vin,
    })
    setEditingVehicle(vehicle.id)
    setIsAddingVehicle(true)
  }

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'vehicles', vehicleId))
      await loadVehicles()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
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
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Vehicles</h2>
        <button
          onClick={() => setIsAddingVehicle(!isAddingVehicle)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {isAddingVehicle ? 'Cancel' : 'Add Vehicle'}
        </button>
      </div>

      {error && (
        <div className="mb-4 text-red-600 text-sm">{error}</div>
      )}

      {isAddingVehicle && (
        <form onSubmit={handleSubmit} className="mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Vehicle Type
              </label>
              <select
                id="type"
                name="type"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="semi">Semi-Truck</option>
                <option value="box">Box Truck</option>
                <option value="van">Van</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700">
                Make
              </label>
              <input
                type="text"
                id="make"
                name="make"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                value={formData.make}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                Model
              </label>
              <input
                type="text"
                id="model"
                name="model"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                value={formData.model}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <input
                type="text"
                id="year"
                name="year"
                required
                pattern="\d{4}"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                value={formData.year}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700">
                License Plate
              </label>
              <input
                type="text"
                id="licensePlate"
                name="licensePlate"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                value={formData.licensePlate}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="vin" className="block text-sm font-medium text-gray-700">
                VIN
              </label>
              <input
                type="text"
                id="vin"
                name="vin"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                value={formData.vin}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {vehicles.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No vehicles added yet</p>
        ) : (
          vehicles.map(vehicle => (
            <div
              key={vehicle.id}
              className="border border-gray-200 rounded-md p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="font-medium">{vehicle.make} {vehicle.model} ({vehicle.year})</h3>
                <p className="text-sm text-gray-500">
                  Type: {vehicle.type} | License: {vehicle.licensePlate}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(vehicle)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 
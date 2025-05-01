'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { db, storage } from '@/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  writeBatch,
  orderBy,
  limit
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { useAuth } from '@/context/AuthContext'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import ReservationCalendar from './ReservationCalendar'
import PropertyAnalytics from './PropertyAnalytics'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface VehicleType {
  type: string
  maxLength: number
  maxHeight: number
  maxWeight: number
}

interface PriceRule {
  id: string
  type: 'time' | 'demand' | 'season'
  multiplier: number
  startDate?: Date
  endDate?: Date
  minOccupancy?: number
  maxOccupancy?: number
  description: string
}

interface BaseProperty {
  id: string
  name: string
  address: string
  description: string
  basePrice: number
  totalSpaces: number
  availableSpaces: number
  images: string[]
  allowedVehicleTypes: VehicleType[]
  priceRules: PriceRule[]
  amenities: string[]
  createdAt: Date
  updatedAt: Date
}

interface ImageWithOrder {
  url: string
  order: number
}

interface Property extends BaseProperty {
  status: 'active' | 'inactive' | 'maintenance'
  analytics: {
    occupancyRate: number
    averageStayDuration: number
    revenue: number
    lastUpdated: Date
  }
  images: ImageWithOrder[]
}

interface ImageCrop {
  file: File
  preview: string
  crop: Crop
}

export default function PropertyManager() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [showPriceRules, setShowPriceRules] = useState(false)
  const [newPriceRule, setNewPriceRule] = useState<Partial<PriceRule>>({
    type: 'time',
    multiplier: 1
  })
  const [croppingImage, setCroppingImage] = useState<ImageCrop | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<{
    labels: string[]
    occupancy: number[]
    revenue: number[]
  }>({
    labels: [],
    occupancy: [],
    revenue: []
  })
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [showCalendar, setShowCalendar] = useState(false)

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      if (!user) return
      
      try {
        const propertiesQuery = query(
          collection(db, 'properties'),
          where('ownerId', '==', user.uid)
        )
        const snapshot = await getDocs(propertiesQuery)
        const propertyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })) as Property[]
        
        setProperties(propertyData)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching properties:', err)
        setError('Failed to load properties')
        setLoading(false)
      }
    }

    fetchProperties()
  }, [user])

  // Image cropping and resizing
  const handleImageCrop = async (crop: Crop) => {
    if (!croppingImage || !editingProperty) return

    const canvas = document.createElement('canvas')
    const image = new Image()
    image.src = croppingImage.preview

    await new Promise(resolve => {
      image.onload = resolve
    })

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const ctx = canvas.getContext('2d')

    canvas.width = crop.width
    canvas.height = crop.height

    ctx?.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    )

    // Resize if needed
    const maxWidth = 1200
    const maxHeight = 800
    let width = crop.width
    let height = crop.height

    if (width > maxWidth) {
      height = (height * maxWidth) / width
      width = maxWidth
    }
    if (height > maxHeight) {
      width = (width * maxHeight) / height
      height = maxHeight
    }

    const resizeCanvas = document.createElement('canvas')
    resizeCanvas.width = width
    resizeCanvas.height = height
    const resizeCtx = resizeCanvas.getContext('2d')
    resizeCtx?.drawImage(canvas, 0, 0, width, height)

    const blob = await new Promise<Blob>((resolve) => {
      resizeCanvas.toBlob(
        (blob) => resolve(blob as Blob),
        'image/jpeg',
        0.9
      )
    })

    const file = new File([blob], croppingImage.file.name, {
      type: 'image/jpeg'
    })

    await onDrop([file], editingProperty.id)
    setCroppingImage(null)
  }

  // Enhanced image upload handling
  const onDrop = useCallback(async (acceptedFiles: File[], propertyId: string) => {
    if (!acceptedFiles.length) return

    const file = acceptedFiles[0]
    const preview = URL.createObjectURL(file)
    
    setCroppingImage({
      file,
      preview,
      crop: {
        unit: '%',
        width: 100,
        height: 100,
        x: 0,
        y: 0
      }
    })
  }, [])

  // Bulk operations
  const handleBulkPriceUpdate = async (percentage: number) => {
    try {
      const batch = writeBatch(db)
      
      selectedProperties.forEach(propertyId => {
        const property = properties.find(p => p.id === propertyId)
        if (property) {
          const newPrice = property.basePrice * (1 + percentage / 100)
          batch.update(doc(db, 'properties', propertyId), {
            basePrice: newPrice,
            updatedAt: new Date()
          })
        }
      })

      await batch.commit()

      setProperties(properties.map(property => 
        selectedProperties.has(property.id)
          ? {
              ...property,
              basePrice: property.basePrice * (1 + percentage / 100),
              updatedAt: new Date()
            }
          : property
      ))
    } catch (err) {
      console.error('Error updating prices:', err)
      setError('Failed to update prices')
    }
  }

  // Price rule management
  const addPriceRule = async () => {
    if (!editingProperty || !newPriceRule.type || !newPriceRule.multiplier) return

    try {
      const priceRule: PriceRule = {
        id: Math.random().toString(36).substr(2, 9),
        ...newPriceRule as PriceRule
      }

      const updatedRules = [...editingProperty.priceRules, priceRule]
      await updateDoc(doc(db, 'properties', editingProperty.id), {
        priceRules: updatedRules,
        updatedAt: new Date()
      })

      setProperties(properties.map(p =>
        p.id === editingProperty.id
          ? { ...p, priceRules: updatedRules, updatedAt: new Date() }
          : p
      ))

      setNewPriceRule({ type: 'time', multiplier: 1 })
    } catch (err) {
      console.error('Error adding price rule:', err)
      setError('Failed to add price rule')
    }
  }

  // Vehicle type management
  const updateAllowedVehicles = async (vehicles: VehicleType[]) => {
    if (!editingProperty) return

    try {
      await updateDoc(doc(db, 'properties', editingProperty.id), {
        allowedVehicleTypes: vehicles,
        updatedAt: new Date()
      })

      setProperties(properties.map(p =>
        p.id === editingProperty.id
          ? { ...p, allowedVehicleTypes: vehicles, updatedAt: new Date() }
          : p
      ))
    } catch (err) {
      console.error('Error updating allowed vehicles:', err)
      setError('Failed to update allowed vehicles')
    }
  }

  // Property status management
  const updatePropertyStatus = async (propertyId: string, status: Property['status']) => {
    try {
      await updateDoc(doc(db, 'properties', propertyId), {
        status,
        updatedAt: new Date()
      })

      setProperties(properties.map(p =>
        p.id === propertyId
          ? { ...p, status, updatedAt: new Date() }
          : p
      ))
    } catch (err) {
      console.error('Error updating property status:', err)
      setError('Failed to update property status')
    }
  }

  // Batch vehicle restrictions
  const applyBatchVehicleRestrictions = async (vehicles: VehicleType[]) => {
    try {
      const batch = writeBatch(db)
      
      selectedProperties.forEach(propertyId => {
        batch.update(doc(db, 'properties', propertyId), {
          allowedVehicleTypes: vehicles,
          updatedAt: new Date()
        })
      })

      await batch.commit()

      setProperties(properties.map(property =>
        selectedProperties.has(property.id)
          ? { ...property, allowedVehicleTypes: vehicles, updatedAt: new Date() }
          : property
      ))
    } catch (err) {
      console.error('Error updating vehicle restrictions:', err)
      setError('Failed to update vehicle restrictions')
    }
  }

  // Analytics data fetching
  const fetchAnalytics = async (propertyId: string) => {
    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('propertyId', '==', propertyId),
        where('startTime', '>=', thirtyDaysAgo),
        orderBy('startTime', 'asc')
      )

      const snapshot = await getDocs(bookingsQuery)
      const bookings = snapshot.docs.map(doc => ({
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate()
      }))

      // Process data for charts
      const dailyData = new Map()
      for (let i = 0; i < 30; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toLocaleDateString()
        dailyData.set(dateStr, {
          occupancy: 0,
          revenue: 0,
          totalHours: 0
        })
      }

      bookings.forEach(booking => {
        const dateStr = booking.startTime.toLocaleDateString()
        const data = dailyData.get(dateStr) || { occupancy: 0, revenue: 0, totalHours: 0 }
        const hours = (booking.endTime - booking.startTime) / (60 * 60 * 1000)
        data.totalHours += hours
        data.revenue += booking.totalPrice
        dailyData.set(dateStr, data)
      })

      const property = properties.find(p => p.id === propertyId)
      if (property) {
        const labels = Array.from(dailyData.keys()).reverse()
        const occupancy = labels.map(date => {
          const data = dailyData.get(date)
          return (data.totalHours / (24 * property.totalSpaces)) * 100
        })
        const revenue = labels.map(date => dailyData.get(date).revenue)

        setAnalyticsData({ labels, occupancy, revenue })
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load analytics')
    }
  }

  // Bulk image operations
  const handleBulkImageDelete = async (propertyId: string) => {
    try {
      const property = properties.find(p => p.id === propertyId)
      if (!property) return

      const updatedImages = property.images.filter(img => !selectedImages.has(img.url))
      
      // Delete from storage
      await Promise.all(
        Array.from(selectedImages).map(async (imageUrl) => {
          const imageRef = ref(storage, imageUrl)
          await deleteObject(imageRef)
        })
      )

      // Update Firestore
      await updateDoc(doc(db, 'properties', propertyId), {
        images: updatedImages,
        updatedAt: new Date()
      })

      setProperties(properties.map(p =>
        p.id === propertyId
          ? { ...p, images: updatedImages, updatedAt: new Date() }
          : p
      ))

      setSelectedImages(new Set())
    } catch (err) {
      console.error('Error deleting images:', err)
      setError('Failed to delete images')
    }
  }

  const handleImageReorder = async (propertyId: string, startIndex: number, endIndex: number) => {
    try {
      const property = properties.find(p => p.id === propertyId)
      if (!property) return

      const updatedImages = [...property.images]
      const [movedImage] = updatedImages.splice(startIndex, 1)
      updatedImages.splice(endIndex, 0, movedImage)

      // Update order numbers
      const reorderedImages = updatedImages.map((img, index) => ({
        ...img,
        order: index
      }))

      await updateDoc(doc(db, 'properties', propertyId), {
        images: reorderedImages,
        updatedAt: new Date()
      })

      setProperties(properties.map(p =>
        p.id === propertyId
          ? { ...p, images: reorderedImages, updatedAt: new Date() }
          : p
      ))
    } catch (err) {
      console.error('Error reordering images:', err)
      setError('Failed to reorder images')
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
      {/* Bulk Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Bulk Actions</h2>
        <div className="flex items-center gap-4">
          <input
            type="number"
            placeholder="Price change %"
            className="border rounded px-3 py-2 w-32"
            onChange={(e) => {
              const value = parseFloat(e.target.value)
              if (!isNaN(value)) handleBulkPriceUpdate(value)
            }}
          />
          <button
            onClick={() => setSelectedProperties(new Set())}
            className="text-gray-600 hover:text-gray-800"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Property List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {properties.map(property => (
            <div
              key={property.id}
              className={`p-6 ${
                selectedProperties.has(property.id) ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedProperties.has(property.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedProperties)
                      if (e.target.checked) {
                        newSelected.add(property.id)
                      } else {
                        newSelected.delete(property.id)
                      }
                      setSelectedProperties(newSelected)
                    }}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {property.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          property.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : property.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {property.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{property.address}</p>
                    <p className="text-sm text-gray-500">
                      ${property.basePrice}/hour • {property.availableSpaces}/{property.totalSpaces} spaces
                    </p>
                    <div className="mt-2">
                      <button
                        onClick={() => fetchAnalytics(property.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Analytics
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={property.status}
                    onChange={(e) => updatePropertyStatus(property.id, e.target.value as Property['status'])}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                  <button
                    onClick={() => setEditingProperty(property)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Enhanced Image Gallery */}
              {property.images.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Images</h4>
                    <div className="space-x-2">
                      {selectedImages.size > 0 && (
                        <button
                          onClick={() => handleBulkImageDelete(property.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete Selected
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedImages(new Set())}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {property.images
                      .sort((a, b) => a.order - b.order)
                      .map((image, index) => (
                        <div
                          key={image.url}
                          className={`relative aspect-square group ${
                            selectedImages.has(image.url) ? 'ring-2 ring-blue-500' : ''
                          }`}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', index.toString())
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            const startIndex = parseInt(e.dataTransfer.getData('text/plain'))
                            handleImageReorder(property.id, startIndex, index)
                          }}
                        >
                          <Image
                            src={image.url}
                            alt={`${property.name} - Image ${index + 1}`}
                            fill
                            className="object-cover rounded cursor-move"
                          />
                          <div
                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity"
                            onClick={() => {
                              const newSelected = new Set(selectedImages)
                              if (newSelected.has(image.url)) {
                                newSelected.delete(image.url)
                              } else {
                                newSelected.add(image.url)
                              }
                              setSelectedImages(newSelected)
                            }}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Calendar and Analytics Toggles */}
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
                </button>
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
                </button>
              </div>

              {/* Reservation Calendar */}
              {showCalendar && (
                <div className="mt-4">
                  <ReservationCalendar
                    propertyId={property.id}
                    totalSpaces={property.totalSpaces}
                  />
                </div>
              )}

              {/* Property Analytics */}
              {showAnalytics && (
                <div className="mt-4">
                  <PropertyAnalytics
                    propertyId={property.id}
                    basePrice={property.basePrice}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Property Modal */}
      {editingProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-4">
              Edit {editingProperty.name}
            </h2>

            {/* Image Upload */}
            <div
              {...getRootProps()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500"
            >
              <input {...getInputProps()} />
              <p>Drag & drop images here, or click to select files</p>
            </div>

            {/* Vehicle Types */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Allowed Vehicle Types
              </h3>
              {editingProperty.allowedVehicleTypes.map((vehicle, index) => (
                <div key={index} className="flex items-center gap-4 mb-2">
                  <input
                    type="text"
                    value={vehicle.type}
                    onChange={(e) => {
                      const updated = [...editingProperty.allowedVehicleTypes]
                      updated[index] = { ...vehicle, type: e.target.value }
                      updateAllowedVehicles(updated)
                    }}
                    className="border rounded px-3 py-2"
                  />
                  <button
                    onClick={() => {
                      const updated = editingProperty.allowedVehicleTypes.filter(
                        (_, i) => i !== index
                      )
                      updateAllowedVehicles(updated)
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newVehicle: VehicleType = {
                    type: '',
                    maxLength: 0,
                    maxHeight: 0,
                    maxWeight: 0
                  }
                  updateAllowedVehicles([
                    ...editingProperty.allowedVehicleTypes,
                    newVehicle
                  ])
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Add Vehicle Type
              </button>
            </div>

            {/* Price Rules */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Dynamic Pricing Rules
              </h3>
              <button
                onClick={() => setShowPriceRules(!showPriceRules)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showPriceRules ? 'Hide Rules' : 'Show Rules'}
              </button>

              {showPriceRules && (
                <div className="mt-4 space-y-4">
                  {editingProperty.priceRules.map(rule => (
                    <div
                      key={rule.id}
                      className="border rounded p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{rule.description}</p>
                        <p className="text-sm text-gray-500">
                          Multiplier: {rule.multiplier}x
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          const updated = editingProperty.priceRules.filter(
                            r => r.id !== rule.id
                          )
                          await updateDoc(
                            doc(db, 'properties', editingProperty.id),
                            {
                              priceRules: updated,
                              updatedAt: new Date()
                            }
                          )
                          setProperties(properties.map(p =>
                            p.id === editingProperty.id
                              ? {
                                  ...p,
                                  priceRules: updated,
                                  updatedAt: new Date()
                                }
                              : p
                          ))
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {/* Add New Rule */}
                  <div className="border rounded p-4">
                    <select
                      value={newPriceRule.type}
                      onChange={(e) =>
                        setNewPriceRule({
                          ...newPriceRule,
                          type: e.target.value as 'time' | 'demand' | 'season'
                        })
                      }
                      className="border rounded px-3 py-2 mr-4"
                    >
                      <option value="time">Time-based</option>
                      <option value="demand">Demand-based</option>
                      <option value="season">Seasonal</option>
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      value={newPriceRule.multiplier}
                      onChange={(e) =>
                        setNewPriceRule({
                          ...newPriceRule,
                          multiplier: parseFloat(e.target.value)
                        })
                      }
                      placeholder="Multiplier"
                      className="border rounded px-3 py-2 mr-4"
                    />
                    <button
                      onClick={addPriceRule}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Add Rule
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setEditingProperty(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => setEditingProperty(null)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropping Modal */}
      {croppingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-medium mb-4">Crop Image</h3>
            <ReactCrop
              crop={croppingImage.crop}
              onChange={(_, percentCrop) => 
                setCroppingImage(prev => 
                  prev ? { ...prev, crop: percentCrop } : null
                )
              }
            >
              <img src={croppingImage.preview} alt="Crop preview" />
            </ReactCrop>
            <div className="mt-4 flex justify-end gap-4">
              <button
                onClick={() => setCroppingImage(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleImageCrop(croppingImage.crop)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 
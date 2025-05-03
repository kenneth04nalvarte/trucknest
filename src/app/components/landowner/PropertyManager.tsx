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
  limit,
  FirestoreError
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  StorageError
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
  Legend,
  ChartData
} from 'chart.js'
import ReservationCalendar from './ReservationCalendar'
import PropertyAnalytics from './PropertyAnalytics'
import { differenceInDays } from 'date-fns'
import { validateDimensions } from '@/utils/validation'

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
  type: string;
  maxLength: number;
  maxHeight: number;
  maxWeight: number;
}

interface PriceRule {
  id?: string;
  type: string;
  maxLength: number;
  maxHeight: number;
  maxWeight: number;
  hourly: number;
  daily: number;
  weekly: number;
  monthly: number;
}

interface BaseProperty {
  id: string;
  name: string;
  address: string;
  description: string;
  basePrice: number;
  totalSpaces: number;
  availableSpaces: number;
  allowedVehicleTypes: VehicleType[];
  priceRules: PriceRule[];
  amenities: string[];
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
}

interface ImageWithOrder {
  url: string;
  order: number;
}

interface Property extends Omit<BaseProperty, 'id'> {
  id: string;
  images: ImageWithOrder[];
  status: 'active' | 'inactive' | 'maintenance';
  analytics: {
    occupancyRate: number;
    averageStayDuration: number;
    revenue: number;
    lastUpdated: Date;
  };
}

interface ImageCrop {
  file: File;
  preview: string;
  crop: Crop;
}

interface Booking {
  id: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface PropertyManagerProps {
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
  className?: string;
}

interface AnalyticsData {
  labels: string[];
  occupancy: number[];
  revenue: number[];
  lastUpdated: Date;
}

interface PropertyFormData extends Omit<BaseProperty, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'> {
  dimensions: {
    length: number;
    height: number;
    weight: number;
  };
  priceRule: PriceRule;
}

interface PropertyAnalytics {
  occupancyRate: number;
  averageStayDuration: number;
  revenue: number;
  lastUpdated: Date;
  bookings: Booking[];
}

export default function PropertyManager({ onError, onSuccess, className }: PropertyManagerProps) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showPriceRules, setShowPriceRules] = useState(false);
  const [newPriceRule, setNewPriceRule] = useState<Partial<PriceRule>>({
    type: '',
    maxLength: 0,
    maxHeight: 0,
    maxWeight: 0,
    hourly: 0,
    daily: 0,
    weekly: 0,
    monthly: 0
  });
  const [croppingImage, setCroppingImage] = useState<ImageCrop | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    labels: [],
    occupancy: [],
    revenue: [],
    lastUpdated: new Date()
  });
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showCalendar, setShowCalendar] = useState(false);
  const [newProperty, setNewProperty] = useState<Partial<PropertyFormData>>({
    name: '',
    address: '',
    description: '',
    basePrice: 0,
    totalSpaces: 0,
    availableSpaces: 0,
    allowedVehicleTypes: [],
    priceRule: {
      type: '',
      maxLength: 0,
      maxHeight: 0,
      maxWeight: 0,
      hourly: 0,
      daily: 0,
      weekly: 0,
      monthly: 0
    },
    amenities: [],
    dimensions: {
      length: 0,
      height: 0,
      weight: 0
    }
  });

  // Fetch properties
  useEffect(() => {
    if (!user?.uid) return;
    
    const loadProperties = async () => {
      try {
        setLoading(true);
        const propertiesRef = collection(db, 'properties');
        const q = query(propertiesRef, where('ownerId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const propertiesData: Property[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          propertiesData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          } as Property);
        });
        
        setProperties(propertiesData);
      } catch (err) {
        const error = err as FirestoreError;
        console.error('Error loading properties:', error);
        setError(`Failed to load properties: ${error.message}`);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [user?.uid, onError]);

  // Image cropping and resizing
  const handleImageCrop = async (crop: Crop) => {
    if (!croppingImage || !editingProperty) return;

    try {
      const canvas = document.createElement('canvas');
      const image = new window.Image();
      image.src = croppingImage.preview;

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      // Resize if needed
      const maxWidth = 1200;
      const maxHeight = 800;
      let width = crop.width;
      let height = crop.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }

      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = width;
      resizedCanvas.height = height;
      const resizedCtx = resizedCanvas.getContext('2d');
      resizedCtx?.drawImage(canvas, 0, 0, width, height);

      // Convert to blob and upload
      const blob = await new Promise<Blob>((resolve) => {
        resizedCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.8);
      });

      const storageRef = ref(storage, `properties/${editingProperty.id}/images/${croppingImage.file.name}`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      setEditingProperty(prev => ({
        ...prev!,
        images: [...prev!.images, { url, order: prev!.images.length }]
      }));

      setCroppingImage(null);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image');
      onError?.(error as Error);
    }
  };

  // Enhanced image upload handling
  const handleImageUpload = async (acceptedFiles: File[]) => {
    try {
      const uploadedImages: ImageWithOrder[] = [];
      for (const file of acceptedFiles) {
        const storageRef = ref(storage, `properties/${editingProperty!.id}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        uploadedImages.push({
          url: downloadURL,
          order: uploadedImages.length,
        });
      }
      setEditingProperty(prev => ({
        ...prev!,
        images: [...prev!.images, ...uploadedImages],
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      setError('Failed to upload images');
    }
  };

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
  const handleAddPriceRule = async () => {
    try {
      const updatedRules = [...editingProperty!.priceRules, newPriceRule];
      const vehicleTypes: VehicleType[] = updatedRules.map(rule => ({
        type: rule.type || '',
        maxLength: rule.maxLength || 0,
        maxHeight: rule.maxHeight || 0,
        maxWeight: rule.maxWeight || 0
      }));
      await updateAllowedVehicles(vehicleTypes);
    } catch (error) {
      console.error('Error adding price rule:', error);
    }
  };

  // Vehicle type management
  const updateAllowedVehicles = async (vehicleTypes: VehicleType[]) => {
    if (!editingProperty) return;

    try {
      await updateDoc(doc(db, 'properties', editingProperty.id), {
        allowedVehicleTypes: vehicleTypes,
        updatedAt: new Date()
      });

      setProperties(properties.map(p =>
        p.id === editingProperty.id
          ? { ...p, allowedVehicleTypes: vehicleTypes, updatedAt: new Date() }
          : p
      ));
    } catch (error) {
      console.error('Error updating allowed vehicles:', error);
    }
  };

  // Property status management
  const updatePropertyStatus = async (propertyId: string, status: Property['status']) => {
    try {
      await updateDoc(doc(db, 'properties', propertyId), { status })
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status } : p))
      )
    } catch (error) {
      console.error('Error updating property status:', error)
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
        endTime: doc.data().endTime.toDate(),
        totalPrice: typeof doc.data().totalPrice === 'number' ? doc.data().totalPrice : 0
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

        setAnalyticsData({ labels, occupancy, revenue, lastUpdated: new Date() })
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

  const calculateAnalytics = (bookings: Booking[]): PropertyAnalytics => {
    const data: PropertyAnalytics = {
      occupancyRate: 0,
      averageStayDuration: 0,
      revenue: 0,
      lastUpdated: new Date(),
      bookings: []
    };

    if (bookings.length > 0) {
      const totalDays = 30; // Assuming a 30-day period
      const occupiedDays = bookings.reduce((acc, booking) => {
        const duration = differenceInDays(booking.endTime, booking.startTime);
        return acc + duration;
      }, 0);

      data.occupancyRate = (occupiedDays / totalDays) * 100;
      data.averageStayDuration = occupiedDays / bookings.length;
      data.revenue = bookings.reduce((acc, booking) => acc + (booking.totalPrice || 0), 0);
      data.bookings = bookings;
    }

    return data;
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    onDrop: handleImageUpload,
  });

  const handleCreateProperty = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      const dimensionsValidation = validateDimensions({
        length: newProperty.dimensions?.length || 0,
        height: newProperty.dimensions?.height || 0,
        weight: newProperty.dimensions?.weight || 0
      });

      if (!dimensionsValidation.isValid) {
        setError(dimensionsValidation.errors.join(', '));
        return;
      }

      const propertyData: Omit<Property, 'id'> = {
        ...newProperty as Omit<Property, 'id'>,
        priceRules: newProperty.priceRule ? [newProperty.priceRule] : [],
        ownerId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'properties'), propertyData);
      const newPropertyWithId: Property = {
        ...propertyData,
        id: docRef.id
      };

      setProperties(prev => [...prev, newPropertyWithId]);
      setNewProperty({
        name: '',
        address: '',
        description: '',
        basePrice: 0,
        totalSpaces: 0,
        availableSpaces: 0,
        allowedVehicleTypes: [],
        priceRule: {
          type: '',
          maxLength: 0,
          maxHeight: 0,
          maxWeight: 0,
          hourly: 0,
          daily: 0,
          weekly: 0,
          monthly: 0
        },
        amenities: [],
        dimensions: {
          length: 0,
          height: 0,
          weight: 0
        }
      });
      onSuccess?.('Property created successfully');
    } catch (err) {
      const error = err as Error;
      console.error('Error creating property:', error);
      setError(`Failed to create property: ${error.message}`);
      onError?.(error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name.startsWith('priceRule.')) {
      const [, field] = name.split('.');
      setNewProperty(prev => ({
        ...prev,
        priceRule: {
          type: prev.priceRule?.type ?? '',
          maxLength: prev.priceRule?.maxLength ?? 0,
          maxHeight: prev.priceRule?.maxHeight ?? 0,
          maxWeight: prev.priceRule?.maxWeight ?? 0,
          hourly: prev.priceRule?.hourly ?? 0,
          daily: prev.priceRule?.daily ?? 0,
          weekly: prev.priceRule?.weekly ?? 0,
          monthly: prev.priceRule?.monthly ?? 0,
          [field]: field === 'type' ? value : parseFloat(value) || 0
        }
      }));
    } else if (name.startsWith('dimensions.')) {
      const [, field] = name.split('.');
      setNewProperty(prev => ({
        ...prev,
        dimensions: {
          length: prev.dimensions?.length ?? 0,
          height: prev.dimensions?.height ?? 0,
          weight: prev.dimensions?.weight ?? 0,
          [field]: parseFloat(value) || 0
        }
      }));
    } else {
      setNewProperty(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

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
                  {editingProperty.priceRules.map((rule) => (
                    <div key={rule.id} className="border p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Vehicle Type: {rule.type}</p>
                          <p>Hourly Rate: ${rule.hourly}</p>
                          <p>Daily Rate: ${rule.daily}</p>
                          <p>Weekly Rate: ${rule.weekly}</p>
                          <p>Monthly Rate: ${rule.monthly}</p>
                        </div>
                        <button
                          onClick={() => {
                            const updatedRules = editingProperty.priceRules.filter(
                              r => r.id !== rule.id
                            )
                            updateAllowedVehicles(updatedRules)
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add New Rule */}
                  <div className="border rounded p-4">
                    <select
                      value={newPriceRule.type}
                      onChange={(e) =>
                        setNewPriceRule({
                          ...newPriceRule,
                          type: e.target.value as string
                        })
                      }
                      className="border rounded px-3 py-2 mr-4"
                    >
                      <option value="">Select Vehicle Type</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      value={newPriceRule.hourly}
                      onChange={(e) =>
                        setNewPriceRule({
                          ...newPriceRule,
                          hourly: parseFloat(e.target.value)
                        })
                      }
                      placeholder="Hourly Rate"
                      className="border rounded px-3 py-2 mr-4"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={newPriceRule.daily}
                      onChange={(e) =>
                        setNewPriceRule({
                          ...newPriceRule,
                          daily: parseFloat(e.target.value)
                        })
                      }
                      placeholder="Daily Rate"
                      className="border rounded px-3 py-2 mr-4"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={newPriceRule.weekly}
                      onChange={(e) =>
                        setNewPriceRule({
                          ...newPriceRule,
                          weekly: parseFloat(e.target.value)
                        })
                      }
                      placeholder="Weekly Rate"
                      className="border rounded px-3 py-2 mr-4"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={newPriceRule.monthly}
                      onChange={(e) =>
                        setNewPriceRule({
                          ...newPriceRule,
                          monthly: parseFloat(e.target.value)
                        })
                      }
                      placeholder="Monthly Rate"
                      className="border rounded px-3 py-2"
                    />
                    <button
                      onClick={handleAddPriceRule}
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

      <form onSubmit={handleCreateProperty} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Property Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={newProperty.name || ''}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={newProperty.address || ''}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={newProperty.description || ''}
            onChange={handleInputChange}
            required
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dimensions.length" className="block text-sm font-medium text-gray-700">
              Length (ft)
            </label>
            <input
              type="number"
              id="dimensions.length"
              name="dimensions.length"
              value={newProperty.dimensions?.length || 0}
              onChange={handleInputChange}
              required
              min="0"
              step="0.1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="dimensions.height" className="block text-sm font-medium text-gray-700">
              Height (ft)
            </label>
            <input
              type="number"
              id="dimensions.height"
              name="dimensions.height"
              value={newProperty.dimensions?.height || 0}
              onChange={handleInputChange}
              required
              min="0"
              step="0.1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="dimensions.weight" className="block text-sm font-medium text-gray-700">
              Weight (lbs)
            </label>
            <input
              type="number"
              id="dimensions.weight"
              name="dimensions.weight"
              value={newProperty.dimensions?.weight || 0}
              onChange={handleInputChange}
              required
              min="0"
              step="0.1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="priceRule.hourly" className="block text-sm font-medium text-gray-700">
              Hourly Rate ($)
            </label>
            <input
              type="number"
              id="priceRule.hourly"
              name="priceRule.hourly"
              value={newProperty.priceRule?.hourly || 0}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="priceRule.daily" className="block text-sm font-medium text-gray-700">
              Daily Rate ($)
            </label>
            <input
              type="number"
              id="priceRule.daily"
              name="priceRule.daily"
              value={newProperty.priceRule?.daily || 0}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="priceRule.weekly" className="block text-sm font-medium text-gray-700">
              Weekly Rate ($)
            </label>
            <input
              type="number"
              id="priceRule.weekly"
              name="priceRule.weekly"
              value={newProperty.priceRule?.weekly || 0}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="priceRule.monthly" className="block text-sm font-medium text-gray-700">
              Monthly Rate ($)
            </label>
            <input
              type="number"
              id="priceRule.monthly"
              name="priceRule.monthly"
              value={newProperty.priceRule?.monthly || 0}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Property
        </button>
      </form>
    </div>
  )
} 
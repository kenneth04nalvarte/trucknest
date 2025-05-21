export interface Property {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  location: {
    address: string
    city: string
    state: string
    zipCode: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  amenities: string[]
  rules: string[]
  ownerId: string
  status: 'pending' | 'active' | 'rejected'
  createdAt: Date
  updatedAt: Date
} 
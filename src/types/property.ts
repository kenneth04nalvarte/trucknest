export interface Property {
  id: string;
  name: string;
  description: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  priceRules: {
    hourly: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  amenities: string[];
  status: 'active' | 'inactive' | 'maintenance';
  images: Array<{
    url: string;
    order: number;
  }>;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
} 
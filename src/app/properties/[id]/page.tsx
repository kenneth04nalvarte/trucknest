import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import Link from 'next/link';
import ShareButton from '@/components/ShareButton';
import Map from '@/components/Map';
import ContactForm from '@/components/ContactForm';
import PropertyNearbyAmenities from './PropertyNearbyAmenities';
import Script from 'next/script';
import BookAndPayButton from '@/components/BookAndPayButton';
import { useAuth } from '../../context/AuthContext';

interface PropertyPageProps {
  params: {
    id: string;
  };
}

interface Property {
  id: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  amenities?: string[];
  location?: { lat: number; lng: number };
  hourlyRate?: number;
  availableSpaces?: number;
  pricePerDay?: number;
  images?: string[];
  totalSpaces?: number;
  occupiedSpaces?: number;
}

// Generate metadata for the page
export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const property = await getProperty(params.id);
  
  if (!property) {
    return {
      title: 'Property Not Found',
    };
  }

  const name = property.name || 'Unnamed Property';
  const description = property.description || 'No description available.';
  const imageUrl = property.imageUrl || '/default-property.jpg';

  return {
    title: `${name} - TruckNest Parking`,
    description,
    openGraph: {
      title: name,
      description,
      images: [imageUrl],
    },
  };
}

// Server component to fetch property data
async function getProperty(id: string): Promise<Property | null> {
  const propertyDoc = await getDoc(doc(db, 'properties', id));
  if (!propertyDoc.exists()) return null;
  const data = propertyDoc.data();
  if (data.status !== 'active') return null;
  return { id: propertyDoc.id, ...data } as Property;
}

export default async function PublicPropertyPage({ params }: PropertyPageProps) {
  const property = await getProperty(params.id);

  if (!property) {
    notFound();
  }

  // Generate JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ParkingFacility',
    name: property.name,
    description: property.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: property.state,
      postalCode: property.zipCode,
      addressCountry: 'US'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: property.location?.lat ?? 0,
      longitude: property.location?.lng ?? 0
    },
    priceRange: `$${property.pricePerDay}/day`,
    amenityFeature: (property.amenities ?? []).map((amenity: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity
    })),
    image: property.images?.[0] ?? '',
    url: `https://trucknest-4q7hwykws-kenneths-projects-b5a1aa89.vercel.app/properties/${property.id}`,
    openingHours: 'Mo-Su 00:00-23:59',
    availableSpaces: (property.totalSpaces ?? 0) - (property.occupiedSpaces ?? 0)
  };

  // Fallbacks for rendering
  const name = property.name || 'Unnamed Property';
  const description = property.description || 'No description available.';
  const imageUrl = property.imageUrl || '/default-property.jpg';
  const address = property.address || 'No address provided';
  const amenities = property.amenities || [];
  const location = property.location || { lat: 0, lng: 0 };
  const hourlyRate = property.hourlyRate || 'N/A';
  const availableSpaces = property.availableSpaces || 'N/A';

  const handleNearbyPlacesLoaded = (places: any[]) => {
    // This will be handled client-side in the Map component
    console.log('Nearby places loaded:', places);
  };

  // Get user context (client-side)
  // This will need to be a client component or you can pass user email as a prop
  // For demo, assume you have truckMemberEmail and landMemberStripeAccountId available

  // Example usage:
  // <BookAndPayButton
  //   amount={property.pricePerDay * 100}
  //   landMemberStripeAccountId={property.landMemberStripeAccountId}
  //   propertyId={property.id}
  //   truckMemberEmail={user.email}
  // />

  return (
    <>
      <Script
        id="property-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative h-[400px]">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
            <div className="container mx-auto px-4 py-8">
              <h1 className="text-4xl font-bold text-white mb-2">{name}</h1>
              <p className="text-xl text-white">{address}</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-4">About this Property</h2>
                <p className="text-gray-600">{description}</p>
              </section>

              {/* Amenities */}
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenities.map((amenity: string) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <span className="text-orange">✓</span>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Map & Nearby Amenities (Client Component) */}
              <PropertyNearbyAmenities location={location} propertyName={name} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Booking Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-4">
                  <span className="text-2xl font-bold">{hourlyRate !== 'N/A' ? `$${hourlyRate}` : hourlyRate}</span>
                  <span className="text-gray-600">/hour</span>
                </div>
                <div className="mb-4">
                  <span className="text-gray-600">Available Spaces:</span>
                  <span className="ml-2 font-semibold">{availableSpaces}</span>
                </div>
                {/* Add Book & Pay Button here */}
                {/*
                <BookAndPayButton
                  amount={property.pricePerDay * 100}
                  landMemberStripeAccountId={property.landMemberStripeAccountId}
                  propertyId={property.id}
                  truckMemberEmail={user.email}
                />
                */}
              </div>

              {/* Contact Form */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Contact Property Owner</h2>
                <ContactForm propertyId={property.id} />
              </div>

              {/* Share Button */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Share this Property</h2>
                <ShareButton
                  url={`${process.env.NEXT_PUBLIC_APP_URL}/properties/${property.id}`}
                  title={name}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
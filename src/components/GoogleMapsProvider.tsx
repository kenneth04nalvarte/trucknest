'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | null;
  google: typeof window.google | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null,
  google: null,
});

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [google, setGoogle] = useState<typeof window.google | null>(null);

  useEffect(() => {
    let mounted = true;

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places'],
    });

    loader
      .load()
      .then((google) => {
        if (mounted) {
          setGoogle(google);
          setIsLoaded(true);
        }
      })
      .catch((error) => {
        if (mounted) {
          console.error('Error loading Google Maps:', error);
          setLoadError(error);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">
          Error loading Google Maps: {loadError.message}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError, google }}>
      {children}
    </GoogleMapsContext.Provider>
  );
} 
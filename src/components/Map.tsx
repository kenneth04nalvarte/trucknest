import { useEffect, useRef } from 'react';

interface MapProps {
  center: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  markers?: Array<{
    position: {
      lat: number;
      lng: number;
    };
    title?: string;
  }>;
}

export default function Map({ center, zoom = 13, markers = [] }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (mapRef.current && window.google && window.google.maps) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center,
        zoom,
      });

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Add new markers
      markers.forEach(marker => {
        const mapMarker = new google.maps.Marker({
          position: marker.position,
          map: mapInstance.current,
          title: marker.title,
        });
        markersRef.current.push(mapMarker);
      });
    }
  }, [center, zoom, markers]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full min-h-[400px] rounded-lg shadow-lg"
    />
  );
} 
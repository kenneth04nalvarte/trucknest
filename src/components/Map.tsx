'use client'

import { useEffect, useRef, useState } from 'react'

interface MapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{
    position: { lat: number; lng: number }
    title: string
  }>
}

declare global {
  interface Window {
    google: any
  }
}

export default function Map({ center = { lat: 39.8283, lng: -98.5795 }, zoom = 4, markers = [] }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current) return

      try {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })

        // Add markers
        markers.forEach(marker => {
          new window.google.maps.Marker({
            position: marker.position,
            map: mapInstanceRef.current,
            title: marker.title
          })
        })
      } catch (err) {
        setError('Failed to initialize map')
        console.error('Map initialization error:', err)
      }
    }

    const loadGoogleMapsScript = () => {
      if (window.google) {
        setIsScriptLoaded(true)
        initializeMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCSY-0WgJnF4gtL23hbldUeiw_8P6NX08w`
      script.async = true
      script.defer = true

      script.onload = () => {
        setIsScriptLoaded(true)
        initializeMap()
      }

      script.onerror = () => {
        setError('Failed to load Google Maps script')
      }

      document.head.appendChild(script)
    }

    loadGoogleMapsScript()

    return () => {
      // Cleanup
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null
      }
    }
  }, [center, zoom, markers])

  if (error) {
    return (
      <div className="w-full h-[400px] rounded-lg shadow-lg bg-lightgray flex items-center justify-center">
        <p className="text-darkgray">{error}</p>
      </div>
    )
  }

  if (!isScriptLoaded) {
    return (
      <div className="w-full h-[400px] rounded-lg shadow-lg bg-lightgray flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-[400px] rounded-lg shadow-lg"
      style={{ minHeight: '400px' }}
    />
  )
}
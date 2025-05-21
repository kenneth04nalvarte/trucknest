'use client'

import { useEffect, useRef } from 'react'
import { useGoogleMaps } from './GoogleMapsProvider'

interface MapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{
    position: { lat: number; lng: number }
    title: string
  }>
}

export default function Map({ center = { lat: 39.8283, lng: -98.5795 }, zoom = 4, markers = [] }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const { isLoaded, loadError, google } = useGoogleMaps()

  useEffect(() => {
    if (!isLoaded || !google || !mapRef.current) return

    try {
      // Initialize map
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
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

      // Clear existing markers
      markersRef.current.forEach(marker => marker.map = null)
      markersRef.current = []

      // Add new markers
      markers.forEach(marker => {
        const markerView = new google.maps.marker.AdvancedMarkerElement({
          position: marker.position,
          map: mapInstanceRef.current,
          title: marker.title
        })
        markersRef.current.push(markerView)
      })
    } catch (err) {
      console.error('Map initialization error:', err)
    }

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.map = null)
      markersRef.current = []
      
      // Cleanup map
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null
      }
    }
  }, [isLoaded, google, center, zoom, markers])

  if (loadError) {
    return (
      <div className="w-full h-[400px] rounded-lg shadow-lg bg-lightgray flex items-center justify-center">
        <p className="text-darkgray">Failed to load Google Maps</p>
      </div>
    )
  }

  if (!isLoaded) {
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
'use client'

import { useEffect, useRef, useState } from 'react'
import { useLoadScript } from '@react-google-maps/api'

interface AddressAutocompleteProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void
  placeholder?: string
  className?: string
}

export default function AddressAutocomplete({
  onAddressSelect,
  placeholder = 'Enter an address',
  className = '',
}: AddressAutocompleteProps) {
  const [libraries] = useState(['places'])
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyCSY-0WgJnF4gtL23hbldUeiw_8P6NX08w',
    libraries: libraries as any,
  })

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'US' },
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()
      
      if (place && place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const address = place.formatted_address || ''
        onAddressSelect(address, lat, lng)
      }
    })

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [isLoaded, onAddressSelect])

  if (loadError) {
    return <div>Error loading Google Maps</div>
  }

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  )
} 
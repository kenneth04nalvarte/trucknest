'use client'

import { useEffect, useRef } from 'react'

interface AddressAutocompleteProps {
  value: string
  onAddressSelect: (address: string) => void
  placeholder?: string
  className?: string
}

declare global {
  interface Window {
    google: any
  }
}

export default function AddressAutocomplete({
  value,
  onAddressSelect,
  placeholder = 'Enter address',
  className = ''
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initializeAutocomplete
      document.head.appendChild(script)
    } else {
      initializeAutocomplete()
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [])

  const initializeAutocomplete = () => {
    if (!inputRef.current) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' }
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace()
      if (place.formatted_address) {
        onAddressSelect(place.formatted_address)
      }
    })
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onAddressSelect(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  )
} 
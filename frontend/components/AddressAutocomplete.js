import { useEffect, useRef } from 'react';
import Script from 'next/script';
import styles from '../styles/AddressAutocomplete.module.css';

export default function AddressAutocomplete({ 
  value, 
  onChange, 
  onSelect,
  placeholder = "Enter address",
  required = false,
  className = "",
  error = false
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!window.google || !inputRef.current) return;

    // Initialize Google Places Autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'us' },
      fields: ['address_components', 'formatted_address', 'geometry'],
    });

    // Add listener for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      
      if (!place.geometry) {
        console.warn("No geometry found for the selected place");
        return;
      }

      // Extract address components
      const addressComponents = {
        streetNumber: '',
        streetName: '',
        city: '',
        state: '',
        zipCode: '',
        formatted: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };

      place.address_components.forEach(component => {
        const type = component.types[0];
        switch (type) {
          case 'street_number':
            addressComponents.streetNumber = component.long_name;
            break;
          case 'route':
            addressComponents.streetName = component.long_name;
            break;
          case 'locality':
            addressComponents.city = component.long_name;
            break;
          case 'administrative_area_level_1':
            addressComponents.state = component.short_name;
            break;
          case 'postal_code':
            addressComponents.zipCode = component.long_name;
            break;
        }
      });

      // Call onSelect with the parsed address data
      onSelect?.(addressComponents);
    });

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onSelect]);

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="lazyOnload"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`${styles.input} ${error ? styles.error : ''} ${className}`}
      />
    </>
  );
} 
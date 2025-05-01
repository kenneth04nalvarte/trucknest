import { useState, useEffect } from 'react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat: number, lng: number) => void;
}

export default function AddressAutocomplete({ value, onChange }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (window.google && window.google.maps) {
      const autocompleteService = new google.maps.places.AutocompleteService();
      
      if (value) {
        autocompleteService.getPlacePredictions(
          { input: value },
          (predictions) => {
            setSuggestions(predictions || []);
            setShowSuggestions(true);
          }
        );
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  }, [value]);

  const handleSelect = async (placeId: string) => {
    if (window.google && window.google.maps) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ placeId }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const { formatted_address, geometry } = results[0];
          onChange(
            formatted_address,
            geometry.location.lat(),
            geometry.location.lng()
          );
          setShowSuggestions(false);
        }
      });
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value, 0, 0)}
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        placeholder="Enter address"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(suggestion.place_id)}
            >
              {suggestion.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 
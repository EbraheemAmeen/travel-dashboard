  'use client';

  import React, { useState } from 'react';
  import LocationPicker from '@/app/components/LocationPicker';
  import { geocodeLocation } from '@/utilies/geocode';

  const NewAttractionsPage = () => {
    const [location, setLocation] = useState({ lat: 0, lng: 0 });

    const handleLocationSelect = (lat: number, lng: number) => {
      setLocation({ lat, lng });
      console.log('Selected coordinates:', lat, lng);
    };

    // Optional: Use geocodeLocation if you want to convert address to coordinates manually
    const handleManualGeocode = async () => {
      const result = await geocodeLocation('Paris, France');
      if (result?.results?.length > 0) {
        const { lat, lng } = result.results[0].geometry;
        setLocation({ lat, lng });
      }
    };

    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Create New Attraction</h1>

        {/* Optional geocode button */}
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
          onClick={handleManualGeocode}
        >
          Geocode Paris (for demo)
        </button>

        <LocationPicker
          defaultLat={location.lat}
          defaultLng={location.lng}
          onLocationSelect={handleLocationSelect}
        />

        <div className="mt-4">
          <p>
            <strong>Current Location:</strong>{' '}
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
        </div>
      </div>
    );
  };

  export default NewAttractionsPage;

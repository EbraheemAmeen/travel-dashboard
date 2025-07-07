'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Map as LeafletMap,
} from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import {showErrorToast}   from '@/app/lib/ErrorToastUtils';
import {showSuccsesToast}   from '@/app/lib/SuccessToastUtils';



// Your custom toast

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

type LocationPickerProps = {
  defaultLat?: number;
  defaultLng?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
};

export default function LocationPicker({
  defaultLat = 48.8566,
  defaultLng = 2.3522,
  onLocationSelect,
}: LocationPickerProps) {
  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);
  const [query, setQuery] = useState('');
  const [placeName, setPlaceName] = useState('No place selected');
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 13);
    }
  }, [lat, lng]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1`
      );
      const data = await response.json();
      if (data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);

        setLat(newLat);
        setLng(newLng);
        onLocationSelect?.(newLat, newLng);

        const displayName = result.display_name;
        const address = result.address || {};
        const name = displayName.split(',')[0] || '';
        const city = address.city || address.town || address.village || '';
        const country = address.country || '';

        const fullPlaceName = [name, city, country].filter(Boolean).join(', ');
        setPlaceName(fullPlaceName);
      } else {
        setPlaceName('No place selected');
        showErrorToast('No results found.');
      }
    } catch (error) {
      showErrorToast('Error fetching location.');
      setPlaceName('No place selected');
    } finally {
      setLoading(false);
    }
  };

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setLat(lat);
        setLng(lng);
        setPlaceName('No place selected');
        onLocationSelect?.(lat, lng);
      },
    });
    return null;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-4">
        <input
          type="text"
          placeholder="Search location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="relative w-full">
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          scrollWheelZoom={true}
          className="h-[500px] w-full rounded-md overflow-hidden"
          whenReady={(mapEvent) => {
            mapRef.current = mapEvent.target;
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={[lat, lng]} />
          <MapClickHandler />
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="text-sm space-y-1">
        <div>
          <strong>Selected Coordinates:</strong> {lat.toFixed(5)}, {lng.toFixed(5)}
        </div>
        <div>
          <strong>Place:</strong> {placeName}
        </div>
        <button
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          onClick={() => {
            console.log('Send to API:', { lat, lng, placeName });
            showSuccsesToast(`Send to API: ${lat}, ${lng}, ${placeName}`);
          }}
        >
          Save Location
        </button>
      </div>
    </div>
  );
}

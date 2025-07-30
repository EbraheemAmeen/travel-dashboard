'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom attraction icon
const attractionIcon = L.divIcon({
  className: 'custom-attraction-marker',
  html: `
    <div style="
      background-color: #3B82F6;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface LocationPickerProps {
  onLocationChange: (location: [number, number]) => void;
}

function LocationPicker({ onLocationChange }: LocationPickerProps) {
  useMapEvents({
    click: (e) => {
      onLocationChange([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

interface MapAutoCenterProps {
  center: [number, number];
}

function MapAutoCenter({ center }: MapAutoCenterProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}

interface AttractionMapComponentProps {
  center: [number, number];
  cityCenter: [number, number];
  cityRadius: number;
  onLocationChange: (location: [number, number]) => void;
}

export default function AttractionMapComponent({
  center,
  cityCenter,
  cityRadius,
  onLocationChange
}: AttractionMapComponentProps) {
  const defaultZoom = cityRadius > 50000 ? 10 : cityRadius > 25000 ? 11 : 12;

  return (
    <MapContainer
      center={center}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%',zIndex:1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* City boundary circle */}
      <Circle
        center={cityCenter}
        radius={cityRadius}
        pathOptions={{
          color: '#10B981',
          fillColor: '#10B981',
          fillOpacity: 0.1,
          weight: 2
        }}
      />
      
      {/* Attraction marker */}
      <Marker position={center} icon={attractionIcon} />
      
      {/* Location picker */}
      <LocationPicker onLocationChange={onLocationChange} />
      
      {/* Auto center when center prop changes */}
      <MapAutoCenter center={center} />
    </MapContainer>
  );
} 
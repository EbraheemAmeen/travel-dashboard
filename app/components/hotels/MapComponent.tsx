'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  center: [number, number];
  cityCenter: [number, number];
  cityRadius: number;
  onCenterChange: (center: [number, number]) => void;
  onCityRadiusChange?: (radius: number) => void;
}

// Create custom hotel icon
const hotelIcon = L.divIcon({
  className: 'custom-hotel-icon',
  html: `
    <div style="
      background: #3B82F6;
      border: 2px solid white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">
      🏨
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function LocationPicker({ onCenterChange }: { onCenterChange: (center: [number, number]) => void }) {
  useMapEvents({
    click: (e) => {
      onCenterChange([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function MapAutoCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

// Calculate zoom level based on city radius
function calculateZoomLevel(radius: number): number {
  // Convert radius from meters to a zoom level
  // Smaller radius = higher zoom level
  if (radius <= 1000) return 16; // Very small city
  if (radius <= 2500) return 15; // Small city
  if (radius <= 5000) return 14; // Medium city
  if (radius <= 10000) return 13; // Large city
  if (radius <= 20000) return 12; // Very large city
  return 11; // Extra large city
}

export default function MapComponent({ 
  center, 
  cityCenter, 
  cityRadius, 
  onCenterChange 
}: MapComponentProps) {
  // Calculate appropriate zoom level based on city radius
  const defaultZoom = useMemo(() => calculateZoomLevel(cityRadius), [cityRadius]);

  console.log("MapComponent received:", { center, cityCenter, cityRadius, defaultZoom });

  console.log("Rendering Circle with:", { cityCenter, cityRadius });

  return (
    <MapContainer
      center={center}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%', zIndex: 1 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={center} draggable icon={hotelIcon}>
        <LocationPicker onCenterChange={onCenterChange} />
      </Marker>
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
      <MapAutoCenter center={center} />
    </MapContainer>
  );
} 
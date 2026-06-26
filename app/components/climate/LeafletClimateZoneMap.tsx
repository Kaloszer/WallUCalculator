/**
 * LeafletClimateZoneMap - Client-only Leaflet map wrapper
 *
 * All react-leaflet/leaflet imports are isolated here to prevent SSR issues.
 * This module should only be loaded via dynamic import with ssr: false.
 */

'use client';

import { useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';

interface LeafletClimateZoneMapProps {
  center: [number, number];
  zoom: number;
  selectedPosition: [number, number] | null;
  onLocationSelect: (lat: number, lon: number) => void;
}

/**
 * Marker component with click handler
 */
function LocationMarker({
  position,
  onLocationSelect
}: {
  position: [number, number] | null;
  onLocationSelect: (lat: number, lon: number) => void;
}) {
  const map = useMapEvents({
    click(e) {
      map.locate();
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        <div className="text-sm">
          <div className="font-medium">Selected Location</div>
          <div className="text-gray-600 mt-1">
            {position[0].toFixed(4)}°, {position[1].toFixed(4)}°
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export function LeafletClimateZoneMap({
  center,
  zoom,
  selectedPosition,
  onLocationSelect,
}: LeafletClimateZoneMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(selectedPosition);

  const handleLocationSelect = (lat: number, lon: number) => {
    setPosition([lat, lon]);
    onLocationSelect(lat, lon);
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker
        position={position}
        onLocationSelect={handleLocationSelect}
      />
    </MapContainer>
  );
}

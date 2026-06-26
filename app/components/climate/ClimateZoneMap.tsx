/**
 * ClimateZoneMap Component
 *
 * Interactive map displaying climate zones using Leaflet and OpenStreetMap tiles.
 * Allows users to click on the map to select a location and view climate data.
 */

'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CLIMATE_ZONES } from '@/lib/constants/climateZones';

// Dynamically import all Leaflet map code to avoid SSR issues
const LeafletClimateZoneMap = dynamic(
  () => import('./LeafletClimateZoneMap').then(mod => ({ default: mod.LeafletClimateZoneMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    ),
  }
);

interface ClimateZoneMapProps {
  /** Callback when location is selected */
  onLocationSelect: (lat: number, lon: number) => void;
  /** Initial center position [lat, lon] */
  center?: [number, number];
  /** Initial zoom level */
  zoom?: number;
  /** Currently selected position */
  selectedPosition?: [number, number] | null;
  /** Show climate zone legend */
  showLegend?: boolean;
}

export function ClimateZoneMap({
  onLocationSelect,
  center = [40.0, -100.0],
  zoom = 4,
  selectedPosition = null,
  showLegend = true
}: ClimateZoneMapProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Climate Zone Map
        </CardTitle>
        <CardDescription>
          Click on the map to select a location and view climate data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map - loaded client-side only to avoid SSR issues */}
          <div className="h-[500px] rounded-lg overflow-hidden border">
            <LeafletClimateZoneMap
              center={center}
              zoom={zoom}
              selectedPosition={selectedPosition}
              onLocationSelect={onLocationSelect}
            />
          </div>

          {/* Climate Zone Legend */}
          {showLegend && <ClimateZoneLegend />}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Climate Zone Legend Component
 */
function ClimateZoneLegend() {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Climate Zone Legend</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Object.values(CLIMATE_ZONES).map((zone) => (
          <div key={zone.zone} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded shrink-0"
              style={{ backgroundColor: zone.color }}
            />
            <div className="text-xs">
              <div className="font-medium">Zone {zone.zone}</div>
              <div className="text-gray-600 truncate">{zone.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

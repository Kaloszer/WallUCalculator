/**
 * ClimateDisplay Component
 *
 * Displays climate information including zone, degree days,
 * design temperatures, and thermal performance metrics.
 */

'use client';

import { useEffect, useState } from 'react';
import { Thermometer, Snowflake, Sun, Droplets, Zap, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClimateDataResult, getClimateData } from '@/lib/api/climate';
import { getClimateZone } from '@/lib/constants/climateZones';
import { getClimateSeverity } from '@/lib/calculations/climate';

interface ClimateDisplayProps {
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
  /** Location display name */
  locationName?: string;
  /** Show loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Called when climate data is successfully fetched (lifts it to the parent) */
  onClimateData?: (data: ClimateDataResult) => void;
}

export function ClimateDisplay({
  lat,
  lon,
  locationName,
  loading = false,
  error = null,
  onClimateData,
}: ClimateDisplayProps) {
  const [climateData, setClimateData] = useState<ClimateDataResult | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    const fetchClimateData = async () => {
      setDataLoading(true);
      try {
        const data = await getClimateData(lat, lon);
        setClimateData(data);
        onClimateData?.(data);
      } catch (err) {
        console.error('Failed to fetch climate data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchClimateData();
  }, [lat, lon, onClimateData]);

  if (loading || dataLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Climate Information</CardTitle>
          <CardDescription>Loading climate data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Climate Information</CardTitle>
          <CardDescription>Unable to load climate data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!climateData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Climate Information</CardTitle>
          <CardDescription>No climate data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Select a location to view climate data
          </div>
        </CardContent>
      </Card>
    );
  }

  const zone = getClimateZone(climateData.climateZone as any);
  const severity = getClimateSeverity(climateData);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-5 w-5" />
          Climate Information
        </CardTitle>
        {locationName && (
          <CardDescription>{locationName}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Climate Zone Badge */}
          <div className="flex items-center gap-4">
            <div
              className="px-4 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: zone.color }}
            >
              Zone {zone.zone}
            </div>
            <div>
              <div className="font-medium">{zone.description}</div>
              <div className="text-sm text-gray-500">{severity} Climate</div>
            </div>
          </div>

          {/* Degree Days */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Degree Days
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Snowflake className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Heating</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {climateData.hdd18.toLocaleString()}
                </div>
                <div className="text-xs text-blue-600 mt-1">HDD Base 18°C</div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sun className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Cooling</span>
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  {climateData.cdd18.toLocaleString()}
                </div>
                <div className="text-xs text-orange-600 mt-1">CDD Base 18°C</div>
              </div>
            </div>
          </div>

          {/* Design Temperatures */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Design Temperatures
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Winter (99% Heating)</div>
                <div className="text-2xl font-bold">
                  {zone.winterDesignTemp}°C
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {climateData.hdd18 > climateData.cdd18 ? 'Heating Dominant' : 'Cooling Dominant'}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Summer (1% Cooling)</div>
                <div className="text-2xl font-bold">
                  {zone.summerDesignTemp}°C
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Temperature Range: {(zone.summerDesignTemp - zone.winterDesignTemp).toFixed(0)}°C
                </div>
              </div>
            </div>
          </div>

          {/* Average Conditions */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Average Conditions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Average Temperature</div>
                <div className="text-2xl font-bold">
                  {climateData.avgTemp}°C
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Average Humidity</div>
                <div className="text-2xl font-bold">
                  {climateData.avgHumidity}%
                </div>
              </div>
            </div>
          </div>

          {/* Minimum Requirements */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Minimum wall R-value for {zone.description}: <strong>{zone.minWallRValue} m²K/W</strong>
              {' '}(Minimum roof R-value: {zone.minRoofRValue} m²K/W)
            </AlertDescription>
          </Alert>

          {/* Data Source */}
          <div className="text-xs text-gray-400 text-center">
            Source: {climateData.source === 'api' ? 'Open-Meteo API' : 'Offline Database'}
            {climateData.cachedAt && ` (Cached: ${new Date(climateData.cachedAt).toLocaleDateString()})`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

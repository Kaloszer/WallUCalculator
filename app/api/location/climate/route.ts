/**
 * Climate Data API Route
 *
 * Retrieves climate data from Open-Meteo API including historical weather data.
 * Caches results in localStorage for 24 hours to reduce API calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { findNearestClimateData } from '@/lib/data/climateDatabase';
import { determineClimateZoneFromTemperature } from '@/lib/constants/climateZones';

export const dynamic = 'force-dynamic';

/**
 * Open-Meteo daily weather data response
 */
interface OpenMeteoDailyData {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  temperature_2m_mean: number[];
  relative_humidity_2m_mean: number[];
}

/**
 * Open-Meteo API response
 */
interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: OpenMeteoDailyData;
}

/**
 * Climate data result
 */
export interface ClimateDataResult {
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
  /** Climate zone */
  climateZone: string;
  /** Heating degree days base 18°C */
  hdd18: number;
  /** Cooling degree days base 18°C */
  cdd18: number;
  /** Winter design temperature (99% heating) */
  winterDesignTemp: number;
  /** Summer design temperature (1% cooling) */
  summerDesignTemp: number;
  /** Average annual temperature */
  avgTemp: number;
  /** Average relative humidity */
  avgHumidity: number;
  /** Data source */
  source: 'api' | 'fallback';
  /** Cache timestamp (if cached) */
  cachedAt?: string;
}

/**
 * Cache storage key prefix
 */
const CACHE_KEY_PREFIX = 'climate_data_';

/**
 * Cache duration in milliseconds (24 hours)
 */
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * GET /api/location/climate
 *
 * Query parameters:
 * - lat: Latitude (required)
 * - lon: Longitude (required)
 * - useCache: Whether to use cached data (default: true)
 *
 * @example
 * GET /api/location/climate?lat=40.7128&lon=-74.0060
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const useCache = searchParams.get('useCache') !== 'false';

    // Validate coordinates
    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude parameters are required' },
        { status: 400 }
      );
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum) ||
        latNum < -90 || latNum > 90 ||
        lonNum < -180 || lonNum > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Try to get from cache first
    if (useCache) {
      const cached = getCachedClimateData(latNum, lonNum);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    // Fetch from Open-Meteo API
    const climateData = await fetchClimateDataFromAPI(latNum, lonNum);

    // Cache the result
    setCachedClimateData(latNum, lonNum, climateData);

    return NextResponse.json(climateData);
  } catch (error) {
    console.error('Climate data error:', error);

    // Try fallback to offline database
    const searchParams = request.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lon = parseFloat(searchParams.get('lon') || '0');

    const fallback = getFallbackClimateData(lat, lon);
    if (fallback) {
      return NextResponse.json({
        ...fallback,
        source: 'fallback' as const,
      });
    }

    // All attempts failed
    return NextResponse.json(
      { error: 'Failed to retrieve climate data. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Fetch climate data from Open-Meteo API
 *
 * Uses historical data from the past year to calculate degree days.
 */
async function fetchClimateDataFromAPI(lat: number, lon: number): Promise<ClimateDataResult> {
  // Get date range for past year
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Build Open-Meteo API URL
  const apiUrl = `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${lat}&longitude=${lon}` +
    `&start_date=${startDateStr}&end_date=${endDateStr}` +
    `&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m_mean` +
    `&timezone=auto`;

  const response = await fetch(apiUrl, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo API returned ${response.status}`);
  }

  const data: OpenMeteoResponse = await response.json();

  // Calculate metrics from daily data
  const metrics = calculateClimateMetrics(data.daily);

  // Determine climate zone
  const climateZone = determineClimateZoneFromTemperature(metrics.hdd18, metrics.cdd18);

  return {
    lat: data.latitude,
    lon: data.longitude,
    climateZone,
    ...metrics,
    source: 'api' as const,
  };
}

/**
 * Calculate climate metrics from daily data
 */
function calculateClimateMetrics(daily: OpenMeteoDailyData) {
  let hdd18Sum = 0;
  let cdd18Sum = 0;
  let tempSum = 0;
  let humiditySum = 0;
  const minTemps: number[] = [];
  const maxTemps: number[] = [];

  for (let i = 0; i < daily.time.length; i++) {
    const avgTemp = daily.temperature_2m_mean[i];
    const humidity = daily.relative_humidity_2m_mean[i];
    const minTemp = daily.temperature_2m_min[i];
    const maxTemp = daily.temperature_2m_max[i];

    // Calculate degree days
    if (avgTemp < 18) {
      hdd18Sum += 18 - avgTemp;
    } else {
      cdd18Sum += avgTemp - 18;
    }

    tempSum += avgTemp;
    humiditySum += humidity;
    minTemps.push(minTemp);
    maxTemps.push(maxTemp);
  }

  // Sort for design temperatures
  minTemps.sort((a, b) => a - b);
  maxTemps.sort((a, b) => a - b);

  // Winter design temp = 1st percentile (99% of days are warmer)
  const winterDesignTemp = minTemps[Math.floor(minTemps.length * 0.01)];

  // Summer design temp = 99th percentile (1% of days are hotter)
  const summerDesignTemp = maxTemps[Math.floor(maxTemps.length * 0.99)];

  const count = daily.time.length;

  return {
    hdd18: Math.round(hdd18Sum),
    cdd18: Math.round(cdd18Sum),
    winterDesignTemp: Math.round(winterDesignTemp * 10) / 10,
    summerDesignTemp: Math.round(summerDesignTemp * 10) / 10,
    avgTemp: Math.round((tempSum / count) * 10) / 10,
    avgHumidity: Math.round(humiditySum / count),
  };
}

/**
 * Simple in-memory cache for climate data on the server.
 * Keyed by normalized lat/lon string with a timestamp for TTL enforcement.
 *
 * Note: This cache is process-local and will be lost on cold starts or across
 * multiple instances. For production use with high traffic or serverless
 * deployments, consider a distributed cache (e.g., Redis or Vercel KV).
 */
const climateDataCache = new Map<string, { timestamp: number; climateData: ClimateDataResult }>();

/**
 * Get climate data from cache
 */
function getCachedClimateData(lat: number, lon: number): ClimateDataResult | null {
  const key = CACHE_KEY_PREFIX + `${lat.toFixed(4)}_${lon.toFixed(4)}`;
  const entry = climateDataCache.get(key);

  if (!entry) {
    return null;
  }

  const age = Date.now() - entry.timestamp;

  if (age > CACHE_TTL) {
    climateDataCache.delete(key);
    return null;
  }

  return {
    ...entry.climateData,
    cachedAt: new Date(entry.timestamp).toISOString(),
  };
}

/**
 * Store climate data in cache
 */
function setCachedClimateData(lat: number, lon: number, climateData: ClimateDataResult): void {
  const key = CACHE_KEY_PREFIX + `${lat.toFixed(4)}_${lon.toFixed(4)}`;

  climateDataCache.set(key, {
    timestamp: Date.now(),
    climateData,
  });
}

/**
 * Get fallback climate data from offline database
 */
function getFallbackClimateData(lat: number, lon: number): ClimateDataResult | null {
  const nearest = findNearestClimateData(lat, lon);

  if (!nearest) return null;

  return {
    lat: nearest.lat,
    lon: nearest.lon,
    climateZone: nearest.climateZone,
    hdd18: nearest.hdd18,
    cdd18: nearest.cdd18,
    winterDesignTemp: nearest.winterDesignTemp,
    summerDesignTemp: nearest.summerDesignTemp,
    avgTemp: nearest.avgTemp,
    avgHumidity: nearest.avgHumidity,
    source: 'fallback' as const,
  };
}

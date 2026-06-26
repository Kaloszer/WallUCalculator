/**
 * Weather API Integration
 *
 * Provides real-time weather data fetching and climate information
 * for location-based calculations. Uses Open-Meteo API (free, no API key required)
 * as the primary source with fallback options.
 */

import type {
  Location,
  ClimateData,
  ClimateZone
} from '../types/domain';
import {
  ClimateZoneType,
  determineClimateZoneFromTemperature
} from '../constants/climateZones';

// Open-Meteo API endpoints (free, no API key required)
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';
const OPEN_METEO_GEO_URL = 'https://geocoding-api.open-meteo.com/v1';

/**
 * Weather data response from API
 */
interface WeatherApiResponse {
  latitude: number;
  longitude: number;
  current_weather?: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

/**
 * Geocoding API response
 */
interface GeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation: number;
    feature_code: string;
    country_code: string;
    country: string;
    admin1?: string;
    admin2?: string;
    admin3?: string;
    timezone: string;
    population?: number;
  }>;
  generationtime_ms: number;
}

/**
 * Climate profile for storage
 */
export interface ClimateProfile {
  id: string;
  name: string;
  location: Location;
  climateData: ClimateData;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Search for locations by name
 *
 * @param query - City name or location query
 * @param limit - Maximum number of results (default 10)
 * @returns Array of matching locations
 */
export async function searchLocations(
  query: string,
  limit: number = 10
): Promise<Location[]> {
  try {
    const url = new URL(`${OPEN_METEO_GEO_URL}/search`);
    url.searchParams.append('name', query);
    url.searchParams.append('count', limit.toString());
    url.searchParams.append('language', 'en');
    url.searchParams.append('format', 'json');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data: GeocodingResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.map(result => ({
      country: result.country,
      region: result.admin1 || result.admin2 || '',
      city: result.name,
      lat: result.latitude,
      lon: result.longitude,
      timezone: result.timezone,
      climateZone: inferClimateZoneFromCoords(result.latitude, result.longitude)
    }));
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}

/**
 * Fetch current weather data for a location
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Current weather data or null if error
 */
export async function fetchCurrentWeather(
  lat: number,
  lon: number
): Promise<{
  temperature: number;
  humidity: number;
  windSpeed: number;
  timestamp: string;
} | null> {
  try {
    const url = new URL(`${OPEN_METEO_BASE_URL}/forecast`);
    url.searchParams.append('latitude', lat.toString());
    url.searchParams.append('longitude', lon.toString());
    url.searchParams.append('current_weather', 'true');
    url.searchParams.append('hourly', 'relative_humidity_2m');
    url.searchParams.append('timezone', 'auto');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data: WeatherApiResponse = await response.json();

    if (!data.current_weather) {
      return null;
    }

    // Get current hour index for humidity
    const currentHour = new Date().getHours();
    const humidity = data.hourly?.relative_humidity_2m[currentHour] ?? 50;

    return {
      temperature: data.current_weather.temperature,
      humidity,
      windSpeed: data.current_weather.windspeed,
      timestamp: data.current_weather.time
    };
  } catch (error) {
    console.error('Error fetching current weather:', error);
    return null;
  }
}

/**
 * Fetch historical climate data for calculating degree days
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @param year - Year to fetch data for (default: previous year)
 * @returns Climate data or null if error
 */
export async function fetchClimateData(
  lat: number,
  lon: number,
  year?: number
): Promise<ClimateData | null> {
  try {
    const targetYear = year || new Date().getFullYear() - 1;
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    const url = new URL(`${OPEN_METEO_BASE_URL}/archive`);
    url.searchParams.append('latitude', lat.toString());
    url.searchParams.append('longitude', lon.toString());
    url.searchParams.append('start_date', startDate);
    url.searchParams.append('end_date', endDate);
    url.searchParams.append('daily', 'temperature_2m_max');
    url.searchParams.append('daily', 'temperature_2m_min');
    url.searchParams.append('daily', 'precipitation_sum');
    url.searchParams.append('timezone', 'auto');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Climate API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.daily) {
      return null;
    }

    // Calculate degree days and other metrics
    const dailyTemps = data.daily.temperature_2m_max.map(
      (max: number, i: number) => ({
        max,
        min: data.daily.temperature_2m_min[i]
      })
    );

    const climateMetrics = calculateClimateMetrics(
      dailyTemps,
      data.daily.precipitation_sum
    );

    // Infer location details from coordinates
    const location = await reverseGeocode(lat, lon);

    return {
      location,
      annualAvgTemp: climateMetrics.avgTemp,
      winterDesignTemp: climateMetrics.winterDesignTemp,
      summerDesignTemp: climateMetrics.summerDesignTemp,
      heatingDegreeDays: climateMetrics.hdd18,
      coolingDegreeDays: climateMetrics.cdd18,
      avgHumidity: climateMetrics.avgHumidity,
      winterHumidity: climateMetrics.winterHumidity,
      summerHumidity: climateMetrics.summerHumidity,
      windExposure: determineWindExposure(climateMetrics.avgWindSpeed)
    };
  } catch (error) {
    console.error('Error fetching climate data:', error);
    return null;
  }
}

/**
 * Get simplified climate data for a location
 * Uses current weather and estimated values for quick calculations
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Simplified climate data
 */
export async function fetchQuickClimateData(
  lat: number,
  lon: number
): Promise<ClimateData | null> {
  try {
    const [currentWeather, location] = await Promise.all([
      fetchCurrentWeather(lat, lon),
      reverseGeocode(lat, lon)
    ]);

    if (!currentWeather) {
      return null;
    }

    // Estimate degree days based on latitude and current temperature
    const estimatedHDD = estimateHeatingDegreeDays(lat, currentWeather.temperature);
    const estimatedCDD = estimateCoolingDegreeDays(lat, currentWeather.temperature);

    // Estimate seasonal humidity based on latitude
    const { winterHumidity, summerHumidity } = estimateSeasonalHumidity(
      lat,
      currentWeather.humidity
    );

    // Estimate design temperatures
    const { winterDesignTemp, summerDesignTemp } = estimateDesignTemperatures(
      lat,
      currentWeather.temperature
    );

    return {
      location,
      annualAvgTemp: currentWeather.temperature,
      winterDesignTemp,
      summerDesignTemp,
      heatingDegreeDays: estimatedHDD,
      coolingDegreeDays: estimatedCDD,
      avgHumidity: currentWeather.humidity,
      winterHumidity,
      summerHumidity,
      windExposure: 'normal'
    };
  } catch (error) {
    console.error('Error fetching quick climate data:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get location details
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Location data
 */
async function reverseGeocode(lat: number, lon: number): Promise<Location> {
  try {
    // Use Open-Meteo reverse geocoding
    const url = new URL(`${OPEN_METEO_GEO_URL}/reverse`);
    url.searchParams.append('latitude', lat.toString());
    url.searchParams.append('longitude', lon.toString());

    const response = await fetch(url.toString());
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results[0]) {
        const result = data.results[0];
        return {
          country: result.country || 'Unknown',
          region: result.admin1 || result.admin2 || '',
          city: result.name || 'Unknown',
          lat,
          lon,
          timezone: result.timezone || 'UTC',
          climateZone: inferClimateZoneFromCoords(lat, lon)
        };
      }
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }

  // Fallback: return basic location with inferred climate zone
  return {
    country: 'Unknown',
    region: '',
    city: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    lat,
    lon,
    timezone: 'UTC',
    climateZone: inferClimateZoneFromCoords(lat, lon)
  };
}

/**
 * Infer climate zone from coordinates
 * Uses latitude-based approximation
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Climate zone classification
 */
function inferClimateZoneFromCoords(lat: number, _lon: number): ClimateZone {
  const absLat = Math.abs(lat);

  // Arctic/Subarctic -> Zone 8 (Very Cold)
  if (absLat >= 66) return 8;

  // Cold regions -> Zone 7 (Cold)
  if (absLat >= 55) return 7;

  // Mixed climates -> Zone 5 (Mixed-Humid)
  if (absLat >= 40) {
    return 5;
  }

  // Hot climates (tropical) -> Zone 1 (Hot-Humid)
  if (absLat <= 23) {
    return 1;
  }

  // Subtropical -> Zone 2 (Hot-Dry)
  return 2;
}

/**
 * Calculate climate metrics from daily temperature data
 */
function calculateClimateMetrics(
  dailyTemps: { max: number; min: number }[],
  precipitation: number[]
): {
  avgTemp: number;
  winterDesignTemp: number;
  summerDesignTemp: number;
  hdd18: number;
  cdd18: number;
  avgHumidity: number;
  winterHumidity: number;
  summerHumidity: number;
  avgWindSpeed: number;
} {
  // Calculate average temperature
  const avgTemp = dailyTemps.reduce(
    (sum, t) => sum + (t.max + t.min) / 2,
    0
  ) / dailyTemps.length;

  // Calculate degree days
  let hdd18 = 0;
  let cdd18 = 0;

  dailyTemps.forEach(({ max, min }) => {
    const avg = (max + min) / 2;
    if (avg < 18) {
      hdd18 += 18 - avg;
    } else {
      cdd18 += avg - 18;
    }
  });

  // Find design temperatures (99.6% and 1% percentiles)
  const allTemps = dailyTemps.flatMap(t => [t.max, t.min]).sort((a, b) => a - b);
  const winterDesignTemp = allTemps[Math.floor(allTemps.length * 0.004)] || -15;
  const summerDesignTemp = allTemps[Math.floor(allTemps.length * 0.99)] || 35;

  // Estimate humidity based on precipitation
  const avgPrecipitation = precipitation.reduce((a, b) => a + b, 0) / precipitation.length;
  const avgHumidity = Math.min(85, 40 + avgPrecipitation * 2);

  // Winter/summer humidity estimates
  const winterHumidity = Math.min(90, avgHumidity + 10);
  const summerHumidity = Math.max(30, avgHumidity - 10);

  return {
    avgTemp,
    winterDesignTemp,
    summerDesignTemp,
    hdd18,
    cdd18,
    avgHumidity,
    winterHumidity,
    summerHumidity,
    avgWindSpeed: 5 // Default average wind speed
  };
}

/**
 * Estimate heating degree days from latitude and current temp
 */
function estimateHeatingDegreeDays(lat: number, currentTemp: number): number {
  const absLat = Math.abs(lat);

  // Base HDD by latitude
  let baseHDD = 0;
  if (absLat >= 60) baseHDD = 6000;
  else if (absLat >= 50) baseHDD = 4000;
  else if (absLat >= 40) baseHDD = 2500;
  else if (absLat >= 30) baseHDD = 1000;
  else baseHDD = 200;

  // Adjust based on current temperature
  const tempAdjustment = (15 - currentTemp) * 50;

  return Math.max(0, baseHDD + tempAdjustment);
}

/**
 * Estimate cooling degree days from latitude and current temp
 */
function estimateCoolingDegreeDays(lat: number, currentTemp: number): number {
  const absLat = Math.abs(lat);

  // Base CDD by latitude
  let baseCDD = 0;
  if (absLat <= 20) baseCDD = 3000;
  else if (absLat <= 30) baseCDD = 2000;
  else if (absLat <= 40) baseCDD = 800;
  else if (absLat <= 50) baseCDD = 200;
  else baseCDD = 50;

  // Adjust based on current temperature
  const tempAdjustment = (currentTemp - 20) * 30;

  return Math.max(0, baseCDD + tempAdjustment);
}

/**
 * Estimate seasonal humidity based on latitude and current humidity
 */
function estimateSeasonalHumidity(lat: number, currentHumidity: number): {
  winterHumidity: number;
  summerHumidity: number;
} {
  const absLat = Math.abs(lat);

  // Tropical regions have less seasonal variation
  if (absLat <= 23) {
    return {
      winterHumidity: currentHumidity,
      summerHumidity: currentHumidity
    };
  }

  // Higher latitudes have more variation
  const variation = Math.min(20, absLat / 3);

  return {
    winterHumidity: Math.min(95, currentHumidity + variation),
    summerHumidity: Math.max(30, currentHumidity - variation / 2)
  };
}

/**
 * Estimate design temperatures from latitude and current temp
 */
function estimateDesignTemperatures(
  lat: number,
  currentTemp: number
): { winterDesignTemp: number; summerDesignTemp: number } {
  const absLat = Math.abs(lat);

  // Winter design temp by latitude
  let winterDesignTemp = 0;
  if (absLat >= 60) winterDesignTemp = -30;
  else if (absLat >= 50) winterDesignTemp = -15;
  else if (absLat >= 40) winterDesignTemp = -5;
  else if (absLat >= 30) winterDesignTemp = 5;
  else winterDesignTemp = 10;

  // Summer design temp by latitude
  let summerDesignTemp = 30;
  if (absLat <= 20) summerDesignTemp = 38;
  else if (absLat <= 30) summerDesignTemp = 35;
  else if (absLat <= 40) summerDesignTemp = 32;
  else if (absLat <= 50) summerDesignTemp = 28;
  else summerDesignTemp = 25;

  return { winterDesignTemp, summerDesignTemp };
}

/**
 * Determine wind exposure category
 */
function determineWindExposure(avgWindSpeed: number): 'sheltered' | 'normal' | 'exposed' {
  if (avgWindSpeed < 3) return 'sheltered';
  if (avgWindSpeed > 8) return 'exposed';
  return 'normal';
}

/**
 * Map our climate zone to ASHRAE climate zone type
 *
 * @param zone - Our climate zone classification
 * @returns ASHRAE climate zone type
 */
export function mapToASHRAEZone(zone: ClimateZone): ClimateZoneType {
  const zoneMap: Record<ClimateZone, ClimateZoneType> = {
    1: '2A',  // Hot-Humid
    2: '2B',  // Hot-Dry
    3: '3C',  // Marine (approximation)
    4: '4A',  // Mixed-Humid (approximation)
    5: '4A',  // Mixed-Humid
    6: '4B',  // Mixed-Dry
    7: '6A',  // Cold
    8: '7',   // Very Cold
  };

  return zoneMap[zone] || '4A';
}

/**
 * Validate if coordinates are within valid range
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns True if coordinates are valid
 */
export function isValidCoordinates(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Format coordinates for display
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Formatted string
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 *
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Offline Climate Database
 *
 * Provides climate data fallback when API is unavailable.
 * Contains representative data for major regions and cities.
 */

import { ClimateZoneType } from '../constants/climateZones';

/**
 * Climate data for a specific location
 */
export interface ClimateData {
  /** Location name */
  location: string;
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
  /** Climate zone */
  climateZone: ClimateZoneType;
  /** Heating degree days base 18°C */
  hdd18: number;
  /** Cooling degree days base 18°C */
  cdd18: number;
  /** Winter design temperature (°C) */
  winterDesignTemp: number;
  /** Summer design temperature (°C) */
  summerDesignTemp: number;
  /** Annual average temperature (°C) */
  avgTemp: number;
  /** Average relative humidity (%) */
  avgHumidity: number;
  /** Annual precipitation (mm) */
  annualPrecipitation: number;
}

/**
 * Offline climate database with representative locations
 * Used as fallback when API calls fail or for quick estimates
 */
export const CLIMATE_DATABASE: ClimateData[] = [
  // North America
  {
    location: 'New York, USA',
    lat: 40.7128,
    lon: -74.0060,
    climateZone: '4A',
    hdd18: 2600,
    cdd18: 800,
    winterDesignTemp: -9,
    summerDesignTemp: 33,
    avgTemp: 13,
    avgHumidity: 64,
    annualPrecipitation: 1200
  },
  {
    location: 'Los Angeles, USA',
    lat: 34.0522,
    lon: -118.2437,
    climateZone: '3C',
    hdd18: 600,
    cdd18: 300,
    winterDesignTemp: 4,
    summerDesignTemp: 29,
    avgTemp: 18,
    avgHumidity: 63,
    annualPrecipitation: 380
  },
  {
    location: 'Chicago, USA',
    lat: 41.8781,
    lon: -87.6298,
    climateZone: '5A',
    hdd18: 3500,
    cdd18: 500,
    winterDesignTemp: -18,
    summerDesignTemp: 32,
    avgTemp: 10,
    avgHumidity: 70,
    annualPrecipitation: 940
  },
  {
    location: 'Miami, USA',
    lat: 25.7617,
    lon: -80.1918,
    climateZone: '1A',
    hdd18: 50,
    cdd18: 3500,
    winterDesignTemp: 10,
    summerDesignTemp: 35,
    avgTemp: 25,
    avgHumidity: 75,
    annualPrecipitation: 1500
  },
  {
    location: 'Seattle, USA',
    lat: 47.6062,
    lon: -122.3321,
    climateZone: '4C',
    hdd18: 2000,
    cdd18: 150,
    winterDesignTemp: -3,
    summerDesignTemp: 30,
    avgTemp: 11,
    avgHumidity: 75,
    annualPrecipitation: 950
  },
  {
    location: 'Denver, USA',
    lat: 39.7392,
    lon: -104.9903,
    climateZone: '5B',
    hdd18: 3200,
    cdd18: 600,
    winterDesignTemp: -16,
    summerDesignTemp: 33,
    avgTemp: 10,
    avgHumidity: 50,
    annualPrecipitation: 400
  },
  {
    location: 'Phoenix, USA',
    lat: 33.4484,
    lon: -112.0740,
    climateZone: '2B',
    hdd18: 400,
    cdd18: 3500,
    winterDesignTemp: 2,
    summerDesignTemp: 43,
    avgTemp: 23,
    avgHumidity: 35,
    annualPrecipitation: 200
  },
  {
    location: 'Minneapolis, USA',
    lat: 44.9778,
    lon: -93.2650,
    climateZone: '6A',
    hdd18: 4500,
    cdd18: 400,
    winterDesignTemp: -23,
    summerDesignTemp: 31,
    avgTemp: 7,
    avgHumidity: 65,
    annualPrecipitation: 750
  },

  // Europe
  {
    location: 'London, UK',
    lat: 51.5074,
    lon: -0.1278,
    climateZone: '4C',
    hdd18: 1800,
    cdd18: 200,
    winterDesignTemp: -2,
    summerDesignTemp: 28,
    avgTemp: 11,
    avgHumidity: 75,
    annualPrecipitation: 600
  },
  {
    location: 'Paris, France',
    lat: 48.8566,
    lon: 2.3522,
    climateZone: '4A',
    hdd18: 2200,
    cdd18: 400,
    winterDesignTemp: -5,
    summerDesignTemp: 32,
    avgTemp: 12,
    avgHumidity: 70,
    annualPrecipitation: 650
  },
  {
    location: 'Berlin, Germany',
    lat: 52.5200,
    lon: 13.4050,
    climateZone: '5B',
    hdd18: 2800,
    cdd18: 300,
    winterDesignTemp: -12,
    summerDesignTemp: 30,
    avgTemp: 10,
    avgHumidity: 68,
    annualPrecipitation: 570
  },
  {
    location: 'Rome, Italy',
    lat: 41.9028,
    lon: 12.4964,
    climateZone: '3A',
    hdd18: 900,
    cdd18: 1200,
    winterDesignTemp: 0,
    summerDesignTemp: 35,
    avgTemp: 16,
    avgHumidity: 65,
    annualPrecipitation: 800
  },
  {
    location: 'Madrid, Spain',
    lat: 40.4168,
    lon: -3.7038,
    climateZone: '3B',
    hdd18: 1200,
    cdd18: 1500,
    winterDesignTemp: -2,
    summerDesignTemp: 38,
    avgTemp: 15,
    avgHumidity: 55,
    annualPrecipitation: 450
  },
  {
    location: 'Stockholm, Sweden',
    lat: 59.3293,
    lon: 18.0686,
    climateZone: '6A',
    hdd18: 4200,
    cdd18: 200,
    winterDesignTemp: -20,
    summerDesignTemp: 27,
    avgTemp: 7,
    avgHumidity: 70,
    annualPrecipitation: 550
  },
  {
    location: 'Moscow, Russia',
    lat: 55.7558,
    lon: 37.6173,
    climateZone: '6A',
    hdd18: 5500,
    cdd18: 400,
    winterDesignTemp: -26,
    summerDesignTemp: 28,
    avgTemp: 6,
    avgHumidity: 72,
    annualPrecipitation: 700
  },

  // Asia
  {
    location: 'Tokyo, Japan',
    lat: 35.6762,
    lon: 139.6503,
    climateZone: '3A',
    hdd18: 1200,
    cdd18: 1000,
    winterDesignTemp: -2,
    summerDesignTemp: 34,
    avgTemp: 16,
    avgHumidity: 68,
    annualPrecipitation: 1500
  },
  {
    location: 'Beijing, China',
    lat: 39.9042,
    lon: 116.4074,
    climateZone: '4A',
    hdd18: 2500,
    cdd18: 800,
    winterDesignTemp: -10,
    summerDesignTemp: 35,
    avgTemp: 12,
    avgHumidity: 55,
    annualPrecipitation: 600
  },
  {
    location: 'Mumbai, India',
    lat: 19.0760,
    lon: 72.8777,
    climateZone: '1A',
    hdd18: 10,
    cdd18: 4500,
    winterDesignTemp: 18,
    summerDesignTemp: 38,
    avgTemp: 27,
    avgHumidity: 75,
    annualPrecipitation: 2400
  },
  {
    location: 'Singapore',
    lat: 1.3521,
    lon: 103.8198,
    climateZone: '1A',
    hdd18: 0,
    cdd18: 4000,
    winterDesignTemp: 23,
    summerDesignTemp: 35,
    avgTemp: 27,
    avgHumidity: 84,
    annualPrecipitation: 2300
  },
  {
    location: 'Seoul, South Korea',
    lat: 37.5665,
    lon: 126.9780,
    climateZone: '4A',
    hdd18: 2800,
    cdd18: 700,
    winterDesignTemp: -10,
    summerDesignTemp: 34,
    avgTemp: 12,
    avgHumidity: 65,
    annualPrecipitation: 1300
  },

  // Oceania
  {
    location: 'Sydney, Australia',
    lat: -33.8688,
    lon: 151.2093,
    climateZone: '3C',
    hdd18: 600,
    cdd18: 600,
    winterDesignTemp: 5,
    summerDesignTemp: 33,
    avgTemp: 18,
    avgHumidity: 65,
    annualPrecipitation: 1200
  },
  {
    location: 'Melbourne, Australia',
    lat: -37.8136,
    lon: 144.9631,
    climateZone: '4C',
    hdd18: 1200,
    cdd18: 300,
    winterDesignTemp: 2,
    summerDesignTemp: 35,
    avgTemp: 15,
    avgHumidity: 60,
    annualPrecipitation: 650
  },
  {
    location: 'Auckland, New Zealand',
    lat: -36.8485,
    lon: 174.7633,
    climateZone: '4C',
    hdd18: 800,
    cdd18: 200,
    winterDesignTemp: 4,
    summerDesignTemp: 28,
    avgTemp: 15,
    avgHumidity: 75,
    annualPrecipitation: 1200
  },

  // South America
  {
    location: 'São Paulo, Brazil',
    lat: -23.5505,
    lon: -46.6333,
    climateZone: '3A',
    hdd18: 200,
    cdd18: 800,
    winterDesignTemp: 8,
    summerDesignTemp: 34,
    avgTemp: 20,
    avgHumidity: 75,
    annualPrecipitation: 1500
  },
  {
    location: 'Buenos Aires, Argentina',
    lat: -34.6037,
    lon: -58.3816,
    climateZone: '3A',
    hdd18: 600,
    cdd18: 500,
    winterDesignTemp: 2,
    summerDesignTemp: 34,
    avgTemp: 17,
    avgHumidity: 70,
    annualPrecipitation: 1200
  },

  // Africa
  {
    location: 'Cairo, Egypt',
    lat: 30.0444,
    lon: 31.2357,
    climateZone: '2B',
    hdd18: 300,
    cdd18: 2500,
    winterDesignTemp: 6,
    summerDesignTemp: 41,
    avgTemp: 22,
    avgHumidity: 40,
    annualPrecipitation: 25
  },
  {
    location: 'Cape Town, South Africa',
    lat: -33.9249,
    lon: 18.4241,
    climateZone: '3C',
    hdd18: 800,
    cdd18: 300,
    winterDesignTemp: 5,
    summerDesignTemp: 32,
    avgTemp: 16,
    avgHumidity: 70,
    annualPrecipitation: 500
  }
];

/**
 * Find nearest climate data by coordinates
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Nearest climate data or null if database is empty
 */
export function findNearestClimateData(lat: number, lon: number): ClimateData | null {
  if (CLIMATE_DATABASE.length === 0) return null;

  let nearest = CLIMATE_DATABASE[0];
  let minDistance = calculateDistance(lat, lon, nearest.lat, nearest.lon);

  for (let i = 1; i < CLIMATE_DATABASE.length; i++) {
    const distance = calculateDistance(lat, lon, CLIMATE_DATABASE[i].lat, CLIMATE_DATABASE[i].lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = CLIMATE_DATABASE[i];
    }
  }

  return nearest;
}

/**
 * Find climate data by location name
 *
 * @param location - Location name to search for
 * @returns Climate data if found, null otherwise
 */
export function findClimateDataByLocation(location: string): ClimateData | null {
  const searchLower = location.toLowerCase();
  return CLIMATE_DATABASE.find(
    data => data.location.toLowerCase().includes(searchLower)
  ) || null;
}

/**
 * Calculate Haversine distance between two coordinates
 *
 * @param lat1 - First latitude
 * @param lon1 - First longitude
 * @param lat2 - Second latitude
 * @param lon2 - Second longitude
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get all available locations in the database
 */
export function getAllLocations(): string[] {
  return CLIMATE_DATABASE.map(data => data.location);
}

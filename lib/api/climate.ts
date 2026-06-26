/**
 * Climate Data (client-side)
 *
 * Retrieves climate data from the Open-Meteo archive API directly from the
 * browser (the app is a static export with no server), derives degree-days and
 * design temperatures, and caches results in localStorage for 24h. Falls back to
 * the bundled offline climate database when the API is unavailable.
 */

import { findNearestClimateData } from '@/lib/data/climateDatabase';
import { determineClimateZoneFromTemperature } from '@/lib/constants/climateZones';

interface OpenMeteoDailyData {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  temperature_2m_mean: number[];
  relative_humidity_2m_mean: number[];
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: OpenMeteoDailyData;
}

/** Monthly climate normal derived from the historical daily series */
export interface MonthlyNormal {
  /** Month index (0 = January) */
  month: number;
  /** Mean outdoor temperature for the month in Celsius */
  avgTemp: number;
  /** Mean outdoor relative humidity for the month in percentage */
  avgHumidity: number;
}

/** Climate data result */
export interface ClimateDataResult {
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
  /** Climate zone */
  climateZone: string;
  /** 12 monthly normals (Jan–Dec) derived from the historical daily series */
  monthly?: MonthlyNormal[];
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

const CACHE_KEY_PREFIX = 'climate_data_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get climate data for a coordinate. Tries the localStorage cache, then the
 * Open-Meteo API, then the offline fallback database.
 */
export async function getClimateData(lat: number, lon: number): Promise<ClimateDataResult> {
  if (
    !Number.isFinite(lat) || !Number.isFinite(lon) ||
    lat < -90 || lat > 90 || lon < -180 || lon > 180
  ) {
    throw new Error('Invalid coordinates');
  }

  const cached = getCachedClimateData(lat, lon);
  if (cached) return cached;

  try {
    const climateData = await fetchClimateDataFromAPI(lat, lon);
    setCachedClimateData(lat, lon, climateData);
    return climateData;
  } catch (error) {
    const fallback = getFallbackClimateData(lat, lon);
    if (fallback) return fallback;
    throw error;
  }
}

/** Fetch climate data from Open-Meteo using the past year of historical data. */
async function fetchClimateDataFromAPI(lat: number, lon: number): Promise<ClimateDataResult> {
  // Use 3 years of history so monthly normals are stable (still a single request).
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 3);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const apiUrl =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${lat}&longitude=${lon}` +
    `&start_date=${startDateStr}&end_date=${endDateStr}` +
    `&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m_mean` +
    `&timezone=auto`;

  const response = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });

  if (!response.ok) {
    throw new Error(`Open-Meteo API returned ${response.status}`);
  }

  const data: OpenMeteoResponse = await response.json();
  const metrics = calculateClimateMetrics(data.daily);
  const climateZone = determineClimateZoneFromTemperature(metrics.hdd18, metrics.cdd18);

  return {
    lat: data.latitude,
    lon: data.longitude,
    climateZone,
    ...metrics,
    source: 'api' as const,
  };
}

/** Calculate degree-days, design temps and averages from daily data. */
function calculateClimateMetrics(daily: OpenMeteoDailyData) {
  let hdd18Sum = 0;
  let cdd18Sum = 0;
  let tempSum = 0;
  let humiditySum = 0;
  const minTemps: number[] = [];
  const maxTemps: number[] = [];

  // Per-month accumulators for monthly normals (index 0 = January).
  const monthTempSum = new Array(12).fill(0);
  const monthHumiditySum = new Array(12).fill(0);
  const monthCount = new Array(12).fill(0);

  for (let i = 0; i < daily.time.length; i++) {
    const avgTemp = daily.temperature_2m_mean[i];
    const humidity = daily.relative_humidity_2m_mean[i];

    if (avgTemp < 18) {
      hdd18Sum += 18 - avgTemp;
    } else {
      cdd18Sum += avgTemp - 18;
    }

    tempSum += avgTemp;
    humiditySum += humidity;
    minTemps.push(daily.temperature_2m_min[i]);
    maxTemps.push(daily.temperature_2m_max[i]);

    // daily.time[i] is an ISO date "YYYY-MM-DD"
    const monthIndex = Number(daily.time[i].slice(5, 7)) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      monthTempSum[monthIndex] += avgTemp;
      monthHumiditySum[monthIndex] += humidity;
      monthCount[monthIndex] += 1;
    }
  }

  const monthly: MonthlyNormal[] = Array.from({ length: 12 }, (_, m) => ({
    month: m,
    avgTemp: monthCount[m] ? Math.round((monthTempSum[m] / monthCount[m]) * 10) / 10 : 0,
    avgHumidity: monthCount[m] ? Math.round(monthHumiditySum[m] / monthCount[m]) : 0,
  }));

  minTemps.sort((a, b) => a - b);
  maxTemps.sort((a, b) => a - b);

  const winterDesignTemp = minTemps[Math.floor(minTemps.length * 0.01)];
  const summerDesignTemp = maxTemps[Math.floor(maxTemps.length * 0.99)];
  const count = daily.time.length;
  // Normalize cumulative degree-days to a per-year figure (window may span multiple years).
  const years = Math.max(count / 365.25, 1 / 365.25);

  return {
    hdd18: Math.round(hdd18Sum / years),
    cdd18: Math.round(cdd18Sum / years),
    winterDesignTemp: Math.round(winterDesignTemp * 10) / 10,
    summerDesignTemp: Math.round(summerDesignTemp * 10) / 10,
    avgTemp: Math.round((tempSum / count) * 10) / 10,
    avgHumidity: Math.round(humiditySum / count),
    monthly,
  };
}

function cacheKey(lat: number, lon: number): string {
  return `${CACHE_KEY_PREFIX}${lat.toFixed(4)}_${lon.toFixed(4)}`;
}

function getCachedClimateData(lat: number, lon: number): ClimateDataResult | null {
  try {
    const raw = localStorage.getItem(cacheKey(lat, lon));
    if (!raw) return null;

    const entry = JSON.parse(raw) as { timestamp: number; climateData: ClimateDataResult };
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(cacheKey(lat, lon));
      return null;
    }

    return { ...entry.climateData, cachedAt: new Date(entry.timestamp).toISOString() };
  } catch {
    return null;
  }
}

function setCachedClimateData(lat: number, lon: number, climateData: ClimateDataResult): void {
  try {
    localStorage.setItem(
      cacheKey(lat, lon),
      JSON.stringify({ timestamp: Date.now(), climateData })
    );
  } catch {
    // Ignore storage failures (quota / private mode)
  }
}

/** Get fallback climate data from the bundled offline database. */
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

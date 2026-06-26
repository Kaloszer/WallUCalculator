/**
 * Climate Zone Definitions
 *
 * Based on ASHRAE climate zones and typical building code requirements.
 * Each zone has design temperatures for heating and cooling calculations.
 */

/**
 * Climate zone types following ASHRAE classifications
 */
export type ClimateZoneType =
  | '0B' // Sub-polar
  | '1A'  // Very hot-humid
  | '1B'  // Very hot-dry
  | '2A'  // Hot-humid
  | '2B'  // Hot-dry
  | '3A'  // Warm-humid
  | '3B'  // Warm-dry
  | '3C'  // Warm-marine
  | '4A'  // Mixed-humid
  | '4B'  // Mixed-dry
  | '4C'  // Mixed-marine
  | '5A'  // Cool-humid
  | '5B'  // Cool-dry
  | '6A'  // Cold-humid
  | '6B'  // Cold-dry
  | '7'   // Very cold
  | '8'   // Subarctic;

/**
 * Climate zone configuration data
 */
export interface ClimateZoneConfig {
  /** ASHRAE climate zone code */
  zone: ClimateZoneType;
  /** Zone description */
  description: string;
  /** Winter design temperature (°C) - 99% heating design */
  winterDesignTemp: number;
  /** Summer design temperature (°C) - 1% cooling design */
  summerDesignTemp: number;
  /** Heating degree days base 18°C */
  hdd18: number;
  /** Cooling degree days base 18°C */
  cdd18: number;
  /** Annual precipitation (mm) */
  annualPrecipitation: number;
  /** Typical humidity range */
  humidityRange: [number, number];
  /** Recommended minimum R-value for walls */
  minWallRValue: number;
  /** Recommended minimum R-value for roof */
  minRoofRValue: number;
  /** Color code for visualization */
  color: string;
}

/**
 * Climate zone definitions based on ASHRAE standards
 * These values represent typical ranges for each climate zone.
 */
export const CLIMATE_ZONES: Record<ClimateZoneType, ClimateZoneConfig> = {
  '0B': {
    zone: '0B',
    description: 'Sub-polar',
    winterDesignTemp: -40,
    summerDesignTemp: 15,
    hdd18: 8000,
    cdd18: 0,
    annualPrecipitation: 400,
    humidityRange: [60, 80],
    minWallRValue: 5.0,
    minRoofRValue: 7.0,
    color: '#8B4513'
  },
  '1A': {
    zone: '1A',
    description: 'Very hot-humid',
    winterDesignTemp: 10,
    summerDesignTemp: 38,
    hdd18: 50,
    cdd18: 3500,
    annualPrecipitation: 1500,
    humidityRange: [60, 90],
    minWallRValue: 2.5,
    minRoofRValue: 3.5,
    color: '#FF6B6B'
  },
  '1B': {
    zone: '1B',
    description: 'Very hot-dry',
    winterDesignTemp: 5,
    summerDesignTemp: 43,
    hdd18: 100,
    cdd18: 4500,
    annualPrecipitation: 200,
    humidityRange: [10, 30],
    minWallRValue: 2.5,
    minRoofRValue: 3.5,
    color: '#FF8C42'
  },
  '2A': {
    zone: '2A',
    description: 'Hot-humid',
    winterDesignTemp: 7,
    summerDesignTemp: 35,
    hdd18: 100,
    cdd18: 2500,
    annualPrecipitation: 1200,
    humidityRange: [50, 85],
    minWallRValue: 2.5,
    minRoofRValue: 3.5,
    color: '#FFB347'
  },
  '2B': {
    zone: '2B',
    description: 'Hot-dry',
    winterDesignTemp: 2,
    summerDesignTemp: 40,
    hdd18: 200,
    cdd18: 3500,
    annualPrecipitation: 250,
    humidityRange: [15, 35],
    minWallRValue: 2.5,
    minRoofRValue: 3.5,
    color: '#FFD700'
  },
  '3A': {
    zone: '3A',
    description: 'Warm-humid',
    winterDesignTemp: 2,
    summerDesignTemp: 32,
    hdd18: 500,
    cdd18: 1500,
    annualPrecipitation: 1000,
    humidityRange: [50, 80],
    minWallRValue: 2.5,
    minRoofRValue: 3.5,
    color: '#98FB98'
  },
  '3B': {
    zone: '3B',
    description: 'Warm-dry',
    winterDesignTemp: -2,
    summerDesignTemp: 38,
    hdd18: 800,
    cdd18: 2000,
    annualPrecipitation: 300,
    humidityRange: [20, 40],
    minWallRValue: 2.5,
    minRoofRValue: 3.5,
    color: '#90EE90'
  },
  '3C': {
    zone: '3C',
    description: 'Warm-marine',
    winterDesignTemp: 5,
    summerDesignTemp: 28,
    hdd18: 300,
    cdd18: 500,
    annualPrecipitation: 800,
    humidityRange: [60, 85],
    minWallRValue: 2.5,
    minRoofRValue: 3.5,
    color: '#00CED1'
  },
  '4A': {
    zone: '4A',
    description: 'Mixed-humid',
    winterDesignTemp: -7,
    summerDesignTemp: 32,
    hdd18: 1500,
    cdd18: 1000,
    annualPrecipitation: 1100,
    humidityRange: [45, 75],
    minWallRValue: 3.0,
    minRoofRValue: 4.0,
    color: '#4682B4'
  },
  '4B': {
    zone: '4B',
    description: 'Mixed-dry',
    winterDesignTemp: -10,
    summerDesignTemp: 35,
    hdd18: 2000,
    cdd18: 1200,
    annualPrecipitation: 400,
    humidityRange: [25, 45],
    minWallRValue: 3.0,
    minRoofRValue: 4.0,
    color: '#6495ED'
  },
  '4C': {
    zone: '4C',
    description: 'Mixed-marine',
    winterDesignTemp: -2,
    summerDesignTemp: 26,
    hdd18: 800,
    cdd18: 200,
    annualPrecipitation: 900,
    humidityRange: [60, 80],
    minWallRValue: 3.0,
    minRoofRValue: 4.0,
    color: '#5F9EA0'
  },
  '5A': {
    zone: '5A',
    description: 'Cool-humid',
    winterDesignTemp: -12,
    summerDesignTemp: 28,
    hdd18: 2500,
    cdd18: 400,
    annualPrecipitation: 900,
    humidityRange: [40, 70],
    minWallRValue: 3.5,
    minRoofRValue: 5.0,
    color: '#708090'
  },
  '5B': {
    zone: '5B',
    description: 'Cool-dry',
    winterDesignTemp: -15,
    summerDesignTemp: 30,
    hdd18: 3000,
    cdd18: 600,
    annualPrecipitation: 350,
    humidityRange: [20, 40],
    minWallRValue: 3.5,
    minRoofRValue: 5.0,
    color: '#778899'
  },
  '6A': {
    zone: '6A',
    description: 'Cold-humid',
    winterDesignTemp: -18,
    summerDesignTemp: 26,
    hdd18: 4000,
    cdd18: 200,
    annualPrecipitation: 800,
    humidityRange: [35, 65],
    minWallRValue: 4.0,
    minRoofRValue: 6.0,
    color: '#696969'
  },
  '6B': {
    zone: '6B',
    description: 'Cold-dry',
    winterDesignTemp: -23,
    summerDesignTemp: 28,
    hdd18: 5000,
    cdd18: 300,
    annualPrecipitation: 300,
    humidityRange: [15, 35],
    minWallRValue: 4.0,
    minRoofRValue: 6.0,
    color: '#556B2F'
  },
  '7': {
    zone: '7',
    description: 'Very cold',
    winterDesignTemp: -34,
    summerDesignTemp: 24,
    hdd18: 7000,
    cdd18: 100,
    annualPrecipitation: 500,
    humidityRange: [20, 50],
    minWallRValue: 5.0,
    minRoofRValue: 7.0,
    color: '#483D8B'
  },
  '8': {
    zone: '8',
    description: 'Subarctic',
    winterDesignTemp: -45,
    summerDesignTemp: 20,
    hdd18: 9000,
    cdd18: 50,
    annualPrecipitation: 400,
    humidityRange: [40, 60],
    minWallRValue: 6.0,
    minRoofRValue: 8.0,
    color: '#2F4F4F'
  }
};

/**
 * Get climate zone configuration by zone code
 */
export function getClimateZone(zone: ClimateZoneType): ClimateZoneConfig {
  return CLIMATE_ZONES[zone];
}

/**
 * Get all climate zones sorted by severity (coldest to hottest)
 */
export function getClimateZonesBySeverity(): ClimateZoneConfig[] {
  return Object.values(CLIMATE_ZONES).sort((a, b) => a.winterDesignTemp - b.winterDesignTemp);
}

/**
 * Determine climate zone based on temperature data
 * Simplified classification based on heating/cooling degree days
 */
export function determineClimateZoneFromTemperature(
  hdd18: number,
  cdd18: number
): ClimateZoneType {
  // Subarctic/Very cold
  if (hdd18 >= 7000) return '8';
  if (hdd18 >= 5000) return '7';

  // Cold
  if (hdd18 >= 4000) return cdd18 < 300 ? '6A' : '6B';
  if (hdd18 >= 3000) return cdd18 < 500 ? '5A' : '5B';

  // Mixed
  if (hdd18 >= 2000) return cdd18 < 1000 ? '4C' : '4A';
  if (hdd18 >= 1000) return cdd18 < 800 ? '4C' : '4B';

  // Warm
  if (hdd18 >= 500) return cdd18 < 500 ? '3C' : '3A';
  if (hdd18 >= 200) return cdd18 < 1000 ? '3C' : '3B';

  // Hot
  if (hdd18 >= 100) return cdd18 < 2000 ? '2A' : '2B';
  if (hdd18 >= 50) return cdd18 < 3500 ? '2A' : '1A';

  // Very hot
  return cdd18 >= 4000 ? '1B' : '1A';
}

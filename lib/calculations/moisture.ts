/**
 * Moisture Analysis Calculations
 *
 * Implements Glaser method for condensation analysis,
 * annual moisture accumulation modeling, and drying potential assessment.
 */

import { WallComponent, StudWallType } from '../types/domain';
import { calculateTemperatures, calculateVaporPressureGradient } from './temperatureGradient';
import { calculateSaturationPressure } from './dewPoint';

/**
 * Monthly climate data for annual analysis
 */
export interface MonthlyClimateData {
  /** Month index (0 = January) */
  month: number;
  /** Average outdoor temperature in Celsius */
  temperature: number;
  /** Average outdoor relative humidity in percentage */
  relativeHumidity: number;
}

/**
 * Layer-specific moisture data point
 */
export interface LayerMoistureData {
  /** Layer name */
  material: string;
  /** Position from inside surface in meters */
  position: number;
  /** Temperature at this layer in Celsius */
  temperature: number;
  /** Vapor pressure in Pascals */
  vaporPressure: number;
  /** Saturation vapor pressure in Pascals */
  saturationPressure: number;
  /** Whether condensation occurs at this point */
  hasCondensation: boolean;
  /** Moisture accumulation in kg/m² */
  moistureAccumulation?: number;
}

/**
 * Monthly moisture analysis result
 */
export interface MonthlyMoistureAnalysis {
  /** Month index */
  month: number;
  /** Month name */
  monthName: string;
  /** Outdoor temperature in Celsius */
  outdoorTemp: number;
  /** Outdoor relative humidity in percentage */
  outdoorRH: number;
  /** Indoor conditions assumed */
  indoorTemp: number;
  indoorRH: number;
  /** Layer-by-layer moisture data */
  layerData: LayerMoistureData[];
  /** Total moisture accumulation this month in kg/m² */
  totalAccumulation: number;
  /** Net moisture flow (positive = accumulation, negative = drying) */
  netMoistureFlow: number;
}

/**
 * Annual moisture analysis summary
 */
export interface AnnualMoistureAnalysis {
  /** Monthly analysis data */
  monthlyData: MonthlyMoistureAnalysis[];
  /** Total annual moisture accumulation in kg/m² */
  totalAnnualAccumulation: number;
  /** Peak moisture month */
  peakMoistureMonth: number;
  /** Maximum moisture accumulation in kg/m² */
  maxAccumulation: number;
  /** Drying potential rating */
  dryingPotential: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  /** Overall condensation risk assessment */
  condensationRisk: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Drying potential assessment result
 */
export interface DryingPotentialResult {
  /** Drying potential rating */
  rating: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  /** Percentage of year with drying conditions */
  dryingPercentage: number;
  /** Average drying rate in kg/m²/month during drying periods */
  averageDryingRate: number;
  /** Critical moisture periods */
  criticalPeriods: { month: number; severity: string }[];
}

/**
 * Glaser method analysis result
 */
export interface GlaserAnalysisResult {
  /** Vapor pressure at each layer boundary */
  vaporPressures: number[];
  /** Saturation pressure at each layer boundary */
  saturationPressures: number[];
  /** Temperature at each layer boundary */
  temperatures: number[];
  /** Condensation points (layer indices where condensation occurs) */
  condensationPoints: number[];
  /** Total moisture accumulation in kg/m² */
  moistureAccumulation: number;
  /** Drying potential in kg/m² */
  dryingPotential: number;
}

/**
 * Perform Glaser method analysis for a single month
 *
 * The Glaser method compares vapor pressure distribution against
 * saturation pressure to identify condensation locations.
 *
 * @param components - Wall components
 * @param indoorTemp - Indoor temperature in Celsius
 * @param indoorRH - Indoor relative humidity in percentage
 * @param outdoorTemp - Outdoor temperature in Celsius
 * @param outdoorRH - Outdoor relative humidity in percentage
 * @param studWallType - Stud wall type
 * @returns Glaser analysis result
 */
export function performGlaserAnalysis(
  components: WallComponent[],
  indoorTemp: number,
  indoorRH: number,
  outdoorTemp: number,
  outdoorRH: number,
  studWallType: StudWallType
): GlaserAnalysisResult {
  if (components.length === 0) {
    return {
      vaporPressures: [],
      saturationPressures: [],
      temperatures: [],
      condensationPoints: [],
      moistureAccumulation: 0,
      dryingPotential: 0,
    };
  }

  // Calculate temperature at each layer boundary
  const temperatures = calculateTemperatures(components, indoorTemp, outdoorTemp, studWallType);

  // Calculate vapor pressure gradient
  const vaporPressures = calculateVaporPressureGradient(
    components,
    indoorTemp,
    outdoorTemp,
    indoorRH,
    outdoorRH,
    studWallType
  );

  // Calculate saturation pressure at each boundary
  const saturationPressures = temperatures.map((temp) =>
    calculateSaturationPressure(temp)
  );

  // Identify condensation points
  const condensationPoints: number[] = [];
  let totalMoistureAccumulation = 0;
  let totalDryingPotential = 0;

  for (let i = 0; i < vaporPressures.length; i++) {
    const vp = vaporPressures[i];
    const sp = saturationPressures[i];

    // Check for condensation (vapor pressure >= saturation)
    if (vp >= sp) {
      condensationPoints.push(i);
      // Estimate moisture accumulation (simplified model)
      const excessPressure = vp - sp;
      totalMoistureAccumulation += excessPressure * 0.0001; // kg/m² per Pa
    } else {
      // Drying potential when vapor pressure < saturation
      const pressureDifference = sp - vp;
      totalDryingPotential += pressureDifference * 0.0001; // kg/m² per Pa
    }
  }

  return {
    vaporPressures,
    saturationPressures,
    temperatures,
    condensationPoints,
    moistureAccumulation: totalMoistureAccumulation,
    dryingPotential: totalDryingPotential,
  };
}

/**
 * Calculate annual moisture analysis across 12 months
 *
 * @param components - Wall components
 * @param indoorTemp - Average indoor temperature in Celsius
 * @param indoorRH - Average indoor relative humidity in percentage
 * @param monthlyClimate - Monthly outdoor climate data
 * @param studWallType - Stud wall type
 * @returns Annual moisture analysis summary
 */
export function calculateAnnualMoistureAnalysis(
  components: WallComponent[],
  indoorTemp: number,
  indoorRH: number,
  monthlyClimate: MonthlyClimateData[],
  studWallType: StudWallType
): AnnualMoistureAnalysis {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthlyData: MonthlyMoistureAnalysis[] = [];
  let totalAnnualAccumulation = 0;
  let maxAccumulation = 0;
  let peakMoistureMonth = 0;

  // Analyze each month
  for (let i = 0; i < monthlyClimate.length; i++) {
    const climate = monthlyClimate[i];
    const glaserResult = performGlaserAnalysis(
      components,
      indoorTemp,
      indoorRH,
      climate.temperature,
      climate.relativeHumidity,
      studWallType
    );

    // Build layer data
    let cumulativeThickness = 0;
    const layerData: LayerMoistureData[] = [
      {
        material: 'Inside Surface',
        position: 0,
        temperature: glaserResult.temperatures[0],
        vaporPressure: glaserResult.vaporPressures[0],
        saturationPressure: glaserResult.saturationPressures[0],
        hasCondensation: glaserResult.condensationPoints.includes(0),
      }
    ];

    for (let j = 0; j < components.length; j++) {
      cumulativeThickness += components[j].thickness / 1000;
      layerData.push({
        material: components[j].material,
        position: cumulativeThickness,
        temperature: glaserResult.temperatures[j + 1],
        vaporPressure: glaserResult.vaporPressures[j + 1],
        saturationPressure: glaserResult.saturationPressures[j + 1],
        hasCondensation: glaserResult.condensationPoints.includes(j + 1),
        moistureAccumulation: glaserResult.condensationPoints.includes(j + 1)
          ? glaserResult.moistureAccumulation / glaserResult.condensationPoints.length
          : 0,
      });
    }

    // Calculate net moisture flow
    const netMoistureFlow = glaserResult.moistureAccumulation - glaserResult.dryingPotential;

    monthlyData.push({
      month: i,
      monthName: monthNames[i],
      outdoorTemp: climate.temperature,
      outdoorRH: climate.relativeHumidity,
      indoorTemp,
      indoorRH,
      layerData,
      totalAccumulation: glaserResult.moistureAccumulation,
      netMoistureFlow,
    });

    // Track accumulation
    totalAnnualAccumulation += glaserResult.moistureAccumulation;
    if (glaserResult.moistureAccumulation > maxAccumulation) {
      maxAccumulation = glaserResult.moistureAccumulation;
      peakMoistureMonth = i;
    }
  }

  // Calculate drying potential
  const dryingPotential = assessDryingPotential(monthlyData);

  // Determine overall condensation risk
  const condensationRisk = determineCondensationRisk(monthlyData);

  return {
    monthlyData,
    totalAnnualAccumulation,
    peakMoistureMonth,
    maxAccumulation,
    dryingPotential: dryingPotential.rating,
    condensationRisk,
  };
}

/**
 * Assess drying potential of wall assembly
 *
 * @param monthlyData - Monthly moisture analysis data
 * @returns Drying potential assessment
 */
export function assessDryingPotential(
  monthlyData: MonthlyMoistureAnalysis[]
): DryingPotentialResult {
  let dryingMonths = 0;
  let totalDryingRate = 0;
  const criticalPeriods: { month: number; severity: string }[] = [];

  for (const month of monthlyData) {
    if (month.netMoistureFlow < 0) {
      dryingMonths++;
      totalDryingRate += Math.abs(month.netMoistureFlow);
    }

    // Identify critical moisture periods
    if (month.totalAccumulation > 0.5) {
      criticalPeriods.push({
        month: month.month,
        severity: month.totalAccumulation > 1.0 ? 'high' : 'moderate',
      });
    }
  }

  const dryingPercentage = (dryingMonths / monthlyData.length) * 100;
  const averageDryingRate = dryingMonths > 0 ? totalDryingRate / dryingMonths : 0;

  // Determine rating
  let rating: DryingPotentialResult['rating'];
  if (dryingPercentage >= 80 && averageDryingRate > 0.2) {
    rating = 'excellent';
  } else if (dryingPercentage >= 60 && averageDryingRate > 0.1) {
    rating = 'good';
  } else if (dryingPercentage >= 40) {
    rating = 'moderate';
  } else if (dryingPercentage >= 20) {
    rating = 'poor';
  } else {
    rating = 'critical';
  }

  return {
    rating,
    dryingPercentage,
    averageDryingRate,
    criticalPeriods,
  };
}

/**
 * Determine overall condensation risk level
 *
 * @param monthlyData - Monthly moisture analysis data
 * @returns Condensation risk level
 */
function determineCondensationRisk(
  monthlyData: MonthlyMoistureAnalysis[]
): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  const monthsWithCondensation = monthlyData.filter(m =>
    m.totalAccumulation > 0
  ).length;

  const maxAccumulation = Math.max(...monthlyData.map(m => m.totalAccumulation));

  if (monthsWithCondensation === 0) {
    return 'none';
  } else if (monthsWithCondensation <= 2 && maxAccumulation < 0.1) {
    return 'low';
  } else if (monthsWithCondensation <= 4 && maxAccumulation < 0.3) {
    return 'medium';
  } else if (monthsWithCondensation <= 7 && maxAccumulation < 0.5) {
    return 'high';
  } else {
    return 'critical';
  }
}

/**
 * Mould-growth risk assessment (ISO 13788-style surface-humidity criterion)
 */
export interface MouldRiskResult {
  /** Overall risk level */
  level: 'low' | 'elevated' | 'high';
  /** Highest relative humidity reached at any layer across the year (%, capped at 100) */
  maxSurfaceRH: number;
  /** Month index (0 = January) of the worst case */
  worstMonth: number;
  /** Number of months where a layer exceeds the 80% mould threshold */
  monthsAtRisk: number;
}

/**
 * Assess mould-growth risk from an annual moisture analysis.
 *
 * Mould can grow well before liquid condensation: ISO 13788 flags sustained
 * surface relative humidity above 80%. For each month we take the highest layer
 * RH (= vapour pressure / saturation pressure) and classify the worst case.
 *
 * @param monthlyData - Per-month moisture analysis (from calculateAnnualMoistureAnalysis)
 * @returns Mould risk result
 */
export function assessMouldRisk(monthlyData: MonthlyMoistureAnalysis[]): MouldRiskResult {
  let maxSurfaceRH = 0;
  let worstMonth = 0;
  let monthsAtRisk = 0;
  let anyCondensation = false;

  for (const month of monthlyData) {
    let monthMaxRH = 0;
    for (const layer of month.layerData) {
      if (layer.saturationPressure > 0) {
        const rh = (layer.vaporPressure / layer.saturationPressure) * 100;
        if (rh > monthMaxRH) monthMaxRH = rh;
      }
      if (layer.hasCondensation) anyCondensation = true;
    }
    if (monthMaxRH > maxSurfaceRH) {
      maxSurfaceRH = monthMaxRH;
      worstMonth = month.month;
    }
    if (monthMaxRH > 80) monthsAtRisk++;
  }

  let level: MouldRiskResult['level'] = 'low';
  if (anyCondensation || maxSurfaceRH >= 100) level = 'high';
  else if (maxSurfaceRH >= 80) level = 'elevated';

  return {
    level,
    maxSurfaceRH: Math.min(Math.round(maxSurfaceRH), 100),
    worstMonth,
    monthsAtRisk,
  };
}

/**
 * Generate default monthly climate data for temperate climate
 *
 * @returns Array of 12 months of climate data
 */
export function generateDefaultMonthlyClimate(): MonthlyClimateData[] {
  return [
    { month: 0, temperature: 2.5, relativeHumidity: 85 },
    { month: 1, temperature: 3.8, relativeHumidity: 82 },
    { month: 2, temperature: 6.2, relativeHumidity: 78 },
    { month: 3, temperature: 9.5, relativeHumidity: 72 },
    { month: 4, temperature: 13.2, relativeHumidity: 68 },
    { month: 5, temperature: 16.8, relativeHumidity: 65 },
    { month: 6, temperature: 19.5, relativeHumidity: 62 },
    { month: 7, temperature: 21.2, relativeHumidity: 60 },
    { month: 8, temperature: 20.5, relativeHumidity: 63 },
    { month: 9, temperature: 17.0, relativeHumidity: 68 },
    { month: 10, temperature: 12.3, relativeHumidity: 75 },
    { month: 11, temperature: 6.8, relativeHumidity: 80 },
  ];
}

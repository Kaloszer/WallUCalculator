/**
 * Climate-based Calculations
 *
 * Functions for calculating climate-adjusted thermal performance
 * and energy-related metrics based on location data.
 */

import { ClimateDataResult } from '@/lib/api/climate';
import { getClimateZone, ClimateZoneConfig, ClimateZoneType } from '@/lib/constants/climateZones';

/**
 * Climate-adjusted thermal performance metrics
 */
export interface ClimateAdjustedPerformance {
  /** Base U-value from wall assembly */
  baseUValue: number;
  /** Climate-adjusted U-value */
  adjustedUValue: number;
  /** Annual heating load estimate (kWh/m²/year) */
  annualHeatingLoad: number;
  /** Annual cooling load estimate (kWh/m²/year) */
  annualCoolingLoad: number;
  /** Total annual energy load (kWh/m²/year) */
  totalEnergyLoad: number;
  /** Heating dominant (true) or cooling dominant (false) */
  heatingDominant: boolean;
  /** Climate efficiency rating (0-100) */
  climateEfficiencyRating: number;
  /** Recommended improvements */
  recommendations: string[];
}

/**
 * Calculate climate-adjusted thermal performance
 *
 * Adjusts U-value based on climate zone and calculates
 * estimated annual heating/cooling loads.
 *
 * @param uValue - Base U-value from wall assembly (W/m²K)
 * @param climateData - Climate data for location
 * @param wallArea - Wall area in m² (default: 1 m²)
 * @returns Climate-adjusted performance metrics
 */
export function calculateClimateAdjustedPerformance(
  uValue: number,
  climateData: ClimateDataResult,
  wallArea: number = 1
): ClimateAdjustedPerformance {
  const zone = getClimateZone(climateData.climateZone as unknown as ClimateZoneType);

  // Annual heating load (kWh/m²/year)
  // Formula: HDD × 24 × U-value × area
  const annualHeatingLoad = Math.abs(climateData.hdd18 * 24 * uValue * wallArea);

  // Annual cooling load (kWh/m²/year)
  // Formula: CDD × 24 × U-value × area × 0.7 (solar gain factor)
  const annualCoolingLoad = Math.abs(climateData.cdd18 * 24 * uValue * wallArea * 0.7);

  // Total energy load
  const totalEnergyLoad = annualHeatingLoad + annualCoolingLoad;

  // Determine heating or cooling dominant
  const heatingDominant = annualHeatingLoad > annualCoolingLoad;

  // Calculate climate efficiency rating
  // Higher is better - compares against minimum code requirements
  const efficiencyRating = calculateClimateEfficiencyRating(
    uValue,
    zone,
    heatingDominant
  );

  // Generate recommendations
  const recommendations = generateRecommendations(
    uValue,
    zone,
    heatingDominant,
    efficiencyRating
  );

  // Climate adjustment factor
  // Cold climates: higher adjustment needed for heating
  // Hot climates: higher adjustment needed for cooling
  let adjustmentFactor = 1.0;
  if (heatingDominant) {
    // Heating dominant: adjust for winter performance
    adjustmentFactor = 1.0 + (Math.abs(climateData.hdd18) / 5000) * 0.2;
  } else {
    // Cooling dominant: adjust for summer performance
    adjustmentFactor = 1.0 + (climateData.cdd18 / 2000) * 0.15;
  }

  // Adjusted U-value
  const adjustedUValue = uValue * adjustmentFactor;

  return {
    baseUValue: uValue,
    adjustedUValue,
    annualHeatingLoad: Math.round(annualHeatingLoad),
    annualCoolingLoad: Math.round(annualCoolingLoad),
    totalEnergyLoad: Math.round(totalEnergyLoad),
    heatingDominant,
    climateEfficiencyRating: Math.round(efficiencyRating),
    recommendations,
  };
}

/**
 * Calculate climate efficiency rating
 *
 * Compares actual U-value against minimum code requirements
 * for the specific climate zone.
 *
 * Returns a score from 0-100 where:
 * - 100: Meets code + 30% improvement
 * - 75: Meets code + 15% improvement
 * - 50: Meets code exactly
 * - 25: Below code by 15%
 * - 0: Below code by 30% or more
 */
function calculateClimateEfficiencyRating(
  uValue: number,
  zone: ClimateZoneConfig,
  heatingDominant: boolean
): number {
  const minRValue = heatingDominant ? zone.minWallRValue : zone.minWallRValue * 0.9;
  const minUValue = 1 / minRValue;

  // Calculate how much better/worse than minimum
  const ratio = minUValue / uValue;

  // Map ratio to 0-100 scale
  if (ratio >= 1.3) return 100; // 30% better than minimum
  if (ratio >= 1.15) return 75; // 15% better than minimum
  if (ratio >= 1.0) return 50; // Meets minimum
  if (ratio >= 0.85) return 25; // 15% below minimum
  return 0; // 30% below minimum or worse
}

/**
 * Generate improvement recommendations
 *
 * Provides actionable suggestions based on performance
 * and climate characteristics.
 */
function generateRecommendations(
  uValue: number,
  zone: ClimateZoneConfig,
  heatingDominant: boolean,
  efficiencyRating: number
): string[] {
  const recommendations: string[] = [];

  // Check if minimum R-value is met
  const minRValue = zone.minWallRValue;
  const currentRValue = 1 / uValue;

  if (currentRValue < minRValue) {
    recommendations.push(
      `Wall R-value (${currentRValue.toFixed(2)}) is below minimum for ${zone.description} climate zone (${minRValue}). Consider adding insulation.`
    );
  }

  // Heating dominant recommendations
  if (heatingDominant) {
    if (efficiencyRating < 50) {
      recommendations.push(
        'Consider increasing wall insulation R-value by at least 20% to improve heating efficiency.'
      );
    }
    if (zone.winterDesignTemp < -10) {
      recommendations.push(
        'In cold climates, ensure continuous insulation to prevent thermal bridging.'
      );
      recommendations.push(
        'Consider exterior insulation to improve thermal mass performance.'
      );
    }
  } else {
    // Cooling dominant recommendations
    if (efficiencyRating < 50) {
      recommendations.push(
        'Consider adding radiant barrier or reflective insulation to reduce cooling load.'
      );
    }
    if (zone.summerDesignTemp > 35) {
      recommendations.push(
        'In hot climates, consider light-colored exterior finishes to reduce solar heat gain.'
      );
    }
    if (zone.humidityRange[1] > 70) {
      recommendations.push(
        'High humidity climates require careful vapor barrier placement to prevent condensation.'
      );
    }
  }

  // General recommendations
  if (efficiencyRating >= 75) {
    recommendations.push(
      'Excellent thermal performance! Consider documenting for green building certification.'
    );
  } else if (efficiencyRating >= 50) {
    recommendations.push(
      'Thermal performance meets minimum code requirements.'
    );
  }

  return recommendations;
}

/**
 * Calculate annual energy cost estimate
 *
 * Estimates annual heating and cooling costs based on
 * climate-adjusted performance and energy prices.
 *
 * @param performance - Climate-adjusted performance metrics
 * @param heatingPrice - Heating energy price per kWh (default: $0.12)
 * @param coolingPrice - Cooling energy price per kWh (default: $0.15)
 * @returns Annual energy cost in local currency
 */
export function calculateAnnualEnergyCost(
  performance: ClimateAdjustedPerformance,
  heatingPrice: number = 0.12,
  coolingPrice: number = 0.15
): number {
  const heatingCost = performance.annualHeatingLoad * heatingPrice;
  const coolingCost = performance.annualCoolingLoad * coolingPrice;

  return Math.round((heatingCost + coolingCost) * 100) / 100;
}

/**
 * Calculate payback period for insulation upgrade
 *
 * Estimates how many years it takes for energy savings
 * to pay back the cost of insulation improvements.
 *
 * @param currentUValue - Current wall U-value
 * @param proposedUValue - Proposed U-value after upgrade
 * @param climateData - Climate data for location
 * @param upgradeCost - Cost of insulation upgrade per m²
 * @param energyPrice - Energy price per kWh (default: $0.12)
 * @returns Payback period in years, or null if no savings
 */
export function calculatePaybackPeriod(
  currentUValue: number,
  proposedUValue: number,
  climateData: ClimateDataResult,
  upgradeCost: number,
  energyPrice: number = 0.12
): number | null {
  if (proposedUValue >= currentUValue) return null;

  const currentPerformance = calculateClimateAdjustedPerformance(
    currentUValue,
    climateData
  );
  const proposedPerformance = calculateClimateAdjustedPerformance(
    proposedUValue,
    climateData
  );

  const energySavings = currentPerformance.totalEnergyLoad - proposedPerformance.totalEnergyLoad;
  const annualCostSavings = energySavings * energyPrice;

  if (annualCostSavings <= 0) return null;

  const paybackYears = upgradeCost / annualCostSavings;
  return Math.round(paybackYears * 10) / 10;
}

/**
 * Format degree days for display
 *
 * @param hdd18 - Heating degree days
 * @param cdd18 - Cooling degree days
 * @returns Formatted string
 */
export function formatDegreeDays(hdd18: number, cdd18: number): string {
  const parts: string[] = [];

  if (hdd18 > 0) {
    parts.push(`${hdd18} HDD`);
  }

  if (cdd18 > 0) {
    parts.push(`${cdd18} CDD`);
  }

  return parts.join(', ') || '0 HDD, 0 CDD';
}

/**
 * Determine climate severity
 *
 * @param climateData - Climate data for location
 * @returns Severity description
 */
export function getClimateSeverity(climateData: ClimateDataResult): string {
  const totalDegreeDays = climateData.hdd18 + climateData.cdd18;

  if (totalDegreeDays < 1000) return 'Mild';
  if (totalDegreeDays < 2000) return 'Moderate';
  if (totalDegreeDays < 3500) return 'Severe';
  if (totalDegreeDays < 5000) return 'Very Severe';
  return 'Extreme';
}

/**
 * Cost Calculations
 *
 * Calculates material costs and cost effectiveness metrics
 * for wall assemblies.
 */

import { WallComponent, ThermalPerformance } from '../types/domain';
import { getMaterialByName } from '../constants/materials';

/**
 * Calculate cost of a single wall component
 *
 * @param component - Wall component to calculate cost for
 * @returns Cost in currency per square meter
 *
 * Formula: Cost = cost_per_mm_per_m² × thickness_mm
 */
export function calculateComponentCost(component: WallComponent): number {
  const material = getMaterialByName(component.material);
  if (!material) return 0;

  return material.cost * component.thickness;
}

/**
 * Calculate total cost of wall assembly
 *
 * @param components - Array of wall components
 * @returns Total cost per square meter
 */
export function calculateTotalCost(components: WallComponent[]): number {
  return components.reduce((sum, comp) => sum + calculateComponentCost(comp), 0);
}

/**
 * Calculate cost effectiveness of a component
 *
 * Cost effectiveness measures how much thermal resistance
 * you get per dollar spent. Higher is better.
 *
 * @param component - Wall component
 * @param rValue - R-value of the component
 * @returns Cost effectiveness ratio (m²K/W per $)
 *
 * Formula: Cost_Effectiveness = R_Value / Cost
 */
export function calculateCostEffectiveness(component: WallComponent, rValue: number): number {
  const cost = calculateComponentCost(component);
  if (cost === 0) return 0;

  return rValue / cost;
}

/**
 * Calculate comprehensive thermal performance metrics
 *
 * @param components - Array of wall components
 * @param totalRValue - Total thermal resistance
 * @returns Complete performance metrics
 */
export function calculateThermalPerformance(
  components: WallComponent[],
  totalRValue: number
): ThermalPerformance {
  const totalCost = calculateTotalCost(components);
  const uValue = totalRValue > 0 ? 1 / totalRValue : 0;

  // Average cost effectiveness across all components
  const componentCosts = components.map(comp => {
    const rValue = comp.conductivity > 0
      ? (comp.thickness / 1000) / comp.conductivity
      : 0;
    return calculateComponentCost(comp) > 0
      ? rValue / calculateComponentCost(comp)
      : 0;
  });

  const averageCostEffectiveness = componentCosts.length > 0
    ? componentCosts.reduce((sum, val) => sum + val, 0) / componentCosts.length
    : 0;

  return {
    totalRValue,
    uValue,
    totalCost,
    costEffectiveness: averageCostEffectiveness
  };
}

/**
 * Calculate ROI for insulation upgrade
 *
 * @param currentCost - Cost of current wall per m²
 * @param upgradeCost - Cost of upgrade per m²
 * @param energySavings - Annual energy savings per m²
 * @param years - Years to calculate ROI over
 * @returns ROI percentage and payback period in years
 */
export function calculateInsulationROI(
  currentCost: number,
  upgradeCost: number,
  energySavings: number,
  years: number = 10
): { roi: number; paybackYears: number } {
  const additionalCost = upgradeCost - currentCost;
  const totalSavings = energySavings * years;

  const roi = additionalCost > 0 ? ((totalSavings - additionalCost) / additionalCost) * 100 : 0;
  const paybackYears = energySavings > 0 ? additionalCost / energySavings : 0;

  return {
    roi,
    paybackYears
  };
}

/**
 * Calculate cost breakdown by material type
 *
 * @param components - Array of wall components
 * @returns Object mapping material types to their costs
 */
export function calculateCostBreakdown(components: WallComponent[]): Record<string, number> {
  const breakdown: Record<string, number> = {};

  for (const component of components) {
    const cost = calculateComponentCost(component);
    const material = component.material;

    if (breakdown[material]) {
      breakdown[material] += cost;
    } else {
      breakdown[material] = cost;
    }
  }

  return breakdown;
}

/**
 * Calculate percentage cost contribution of each component
 *
 * @param components - Array of wall components
 * @returns Array of percentages corresponding to each component
 */
export function calculateCostContributions(components: WallComponent[]): number[] {
  const totalCost = calculateTotalCost(components);

  if (totalCost === 0) return components.map(() => 0);

  return components.map(comp => {
    const componentCost = calculateComponentCost(comp);
    return (componentCost / totalCost) * 100;
  });
}

/**
 * Estimate heating/cooling cost based on U-value
 *
 * @param uValue - Thermal transmittance in W/m²K
 * @param heatingDegreeDays - Annual heating degree days for location
 * @param coolingDegreeDays - Annual cooling degree days for location
 * @param energyCost - Energy cost per kWh
 * @param wallArea - Wall area in square meters
 * @returns Estimated annual heating and cooling costs
 */
export function estimateEnergyCosts(
  uValue: number,
  heatingDegreeDays: number = 3000,
  coolingDegreeDays: number = 500,
  energyCost: number = 0.15, // $/kWh
  wallArea: number = 100 // m²
): { heatingCost: number; coolingCost: number; totalCost: number } {
  const heatingLoad = uValue * heatingDegreeDays * 24; // kWh/m²/year
  const coolingLoad = uValue * coolingDegreeDays * 24; // kWh/m²/year

  const heatingCost = (heatingLoad * wallArea * energyCost) / 1000; // Convert to $
  const coolingCost = (coolingLoad * wallArea * energyCost * 1.2) / 1000; // 1.2x for cooling efficiency

  return {
    heatingCost,
    coolingCost,
    totalCost: heatingCost + coolingCost
  };
}

/**
 * R-value (Thermal Resistance) Calculations
 *
 * These functions calculate thermal resistance of wall components
 * and assemblies following ISO 6946 standards.
 */

import { WallComponent, StudWallConfig } from '../types/domain';
import { MM_TO_M } from '../constants/calculations';

/**
 * Calculate thermal resistance (R-value) for a single wall component
 *
 * For layers with studs, uses the parallel path method to calculate
 * the effective R-value considering both studs and insulation.
 *
 * @param component - Wall component to calculate R-value for
 * @param studWallConfig - Stud wall configuration (if component has studs)
 * @returns Thermal resistance in m²K/W
 *
 * @example
 * const rValue = calculateComponentRValue({
 *   thickness: 100,
 *   conductivity: 0.036,
 *   hasStuds: true
 * }, studConfig);
 */
export function calculateComponentRValue(
  component: WallComponent | Omit<WallComponent, 'id'>,
  studWallConfig?: StudWallConfig
): number {
  // Handle stud layers using parallel path method
  if (component.hasStuds && studWallConfig && studWallConfig.type !== 'none') {
    return calculateStudLayerRValue(component, studWallConfig);
  }

  // Standard calculation: R = d / (λ)
  // where d is thickness (m) and λ is conductivity (W/mK)
  return component.conductivity > 0
    ? (component.thickness * MM_TO_M) / component.conductivity
    : 0;
}

/**
 * Calculate effective R-value for stud layers using parallel path method
 *
 * This accounts for both the studs and insulation cavities
 * by calculating the thermal resistance of each path and combining them.
 *
 * @param component - Wall component with studs
 * @param studConfig - Stud wall configuration
 * @returns Effective R-value in m²K/W
 *
 * Formula: R_eff = 1 / (area_stud * (1/R_stud) + area_cavity * (1/R_cavity))
 */
function calculateStudLayerRValue(
  component: WallComponent | Omit<WallComponent, 'id'>,
  studConfig: StudWallConfig
): number {
  const thicknessM = component.thickness * MM_TO_M;

  // R-value of stud path (wood)
  const rStud = thicknessM / studConfig.studConductivity;

  // R-value of insulation path
  const rInsulation = thicknessM / component.conductivity;

  // U-value of each path (inverse of R)
  const uStud = 1 / rStud;
  const uInsulation = 1 / rInsulation;

  // Effective U-value (area-weighted)
  const effectiveU = (studConfig.studArea * uStud) + ((1 - studConfig.studArea) * uInsulation);

  // Effective R-value
  return 1 / effectiveU;
}

/**
 * Calculate total thermal resistance of a wall assembly
 *
 * Sums the R-values of all components including air films.
 *
 * @param components - Array of wall components
 * @param studWallConfig - Stud wall configuration
 * @param includeAirFilms - Whether to include air film resistances
 * @returns Total R-value in m²K/W
 */
export function calculateTotalRValue(
  components: Array<WallComponent | Omit<WallComponent, 'id'>>,
  studWallConfig?: StudWallConfig,
  includeAirFilms: boolean = true
): number {
  const componentsR = components.reduce(
    (sum, comp) => sum + calculateComponentRValue(comp, comp.hasStuds ? studWallConfig : undefined),
    0
  );

  // Standard internal + external film resistance (0.13 + 0.04 = 0.17)
  return includeAirFilms ? componentsR + 0.17 : componentsR;
}

/**
 * Calculate thermal transmittance (U-value) from R-value
 *
 * @param rValue - Thermal resistance in m²K/W
 * @returns U-value in W/m²K
 *
 * Formula: U = 1 / R
 */
export function calculateUValue(rValue: number): number {
  return rValue > 0 ? 1 / rValue : 0;
}

/**
 * Calculate percentage contribution of each component to total R-value
 *
 * @param components - Array of wall components
 * @param studWallConfig - Stud wall configuration
 * @returns Array of percentage contributions (0-100)
 */
export function calculateRValueContributions(
  components: WallComponent[],
  studWallConfig?: StudWallConfig
): number[] {
  const totalR = calculateTotalRValue(components, studWallConfig, false);

  if (totalR === 0) return components.map(() => 0);

  return components.map(comp => {
    const componentR = calculateComponentRValue(comp, comp.hasStuds ? studWallConfig : undefined);
    return (componentR / totalR) * 100;
  });
}

/**
 * Temperature Gradient Calculations
 *
 * Calculates temperature distribution through wall assembly
 * and analyzes condensation risk based on dew point.
 */

import { WallComponent, StudWallType, TemperatureDataPoint, CondensationRisk } from '../types/domain';
import { MM_TO_M } from '../constants/calculations';

/**
 * Calculate temperatures at each layer interface in wall assembly
 *
 * Uses thermal resistance method to distribute temperature drop
 * across each component proportionally to its R-value contribution.
 *
 * @param components - Array of wall components
 * @param insideTemp - Indoor temperature in Celsius
 * @param outsideTemp - Outdoor temperature in Celsius
 * @param studWallType - Type of stud wall
 * @returns Array of temperature at each interface
 *
 * Formula:
 * T_interface = T_inside - (R_interface / R_total) * (T_inside - T_outside)
 */
export function calculateTemperatures(
  components: WallComponent[],
  insideTemp: number,
  outsideTemp: number,
  studWallType: StudWallType
): number[] {
  if (components.length === 0) return [insideTemp];

  const temperatures: number[] = [insideTemp];
  const tempDifference = insideTemp - outsideTemp;

  // Calculate cumulative R-value at each interface
  let cumulativeR = 0;
  const totalR = calculateTotalThermalResistance(components, studWallType);

  for (const component of components) {
    const componentR = calculateComponentRValue(component, studWallType);
    cumulativeR += componentR;

    // Temperature at this interface
    const interfaceTemp = insideTemp - (cumulativeR / totalR) * tempDifference;
    temperatures.push(interfaceTemp);
  }

  return temperatures;
}

/**
 * Calculate thermal resistance for a component
 *
 * @param component - Wall component
 * @returns R-value in m²K/W
 */
function calculateComponentRValue(
  component: WallComponent,
  studWallType?: string
): number {
  const thicknessM = component.thickness * MM_TO_M;
  return thicknessM / component.conductivity;
}

/**
 * Calculate total thermal resistance of wall assembly
 *
 * @param components - Array of wall components
 * @param studWallType - Stud wall type
 * @returns Total R-value in m²K/W
 */
function calculateTotalThermalResistance(
  components: WallComponent[],
  studWallType: StudWallType
): number {
  return components.reduce((sum, comp) => {
    return sum + calculateComponentRValue(comp, studWallType);
  }, 0) + 0.17; // Add air film resistances
}

/**
 * Calculate vapor pressure gradient through wall assembly
 *
 * @param components - Array of wall components
 * @param insideTemp - Indoor temperature in Celsius
 * @param outsideTemp - Outdoor temperature in Celsius
 * @param insideRH - Indoor relative humidity in %
 * @param outsideRH - Outdoor relative humidity in %
 * @param studWallType - Stud wall type
 * @returns Array of vapor pressure at each interface in Pascals
 */
export function calculateVaporPressureGradient(
  components: WallComponent[],
  insideTemp: number,
  outsideTemp: number,
  insideRH: number,
  outsideRH: number,
  studWallType: StudWallType
): number[] {
  if (components.length === 0) return [];

  const temperatures = calculateTemperatures(components, insideTemp, outsideTemp, studWallType);

  // Calculate vapor pressure at each interface
  const vaporPressures: number[] = [];

  // Inside vapor pressure
  vaporPressures.push(calculateVaporPressure(insideTemp, insideRH));

  // Calculate at each layer interface
  for (let i = 0; i < components.length; i++) {
    const temp = temperatures[i + 1];
    const rh = interpolateRelativeHumidity(insideRH, outsideRH, i + 1, components.length + 1);
    vaporPressures.push(calculateVaporPressure(temp, rh));
  }

  return vaporPressures;
}

/**
 * Interpolate relative humidity through wall layers
 *
 * @param insideRH - Indoor relative humidity
 * @param outsideRH - Outdoor relative humidity
 * @param position - Position in wall (1 = first layer interface)
 * @param totalPositions - Total number of positions
 * @returns Interpolated relative humidity
 */
function interpolateRelativeHumidity(
  insideRH: number,
  outsideRH: number,
  position: number,
  totalPositions: number
): number {
  const ratio = position / totalPositions;
  return insideRH - (insideRH - outsideRH) * ratio;
}

/**
 * Calculate vapor pressure from temperature and relative humidity
 *
 * @param temperature - Temperature in Celsius
 * @param relativeHumidity - Relative humidity in percentage
 * @returns Vapor pressure in Pascals
 *
 * Formula: P = RH * P_sat / 100
 * where P_sat is saturation vapor pressure at temperature
 */
function calculateVaporPressure(temperature: number, relativeHumidity: number): number {
  const satPressure = calculateSaturationPressure(temperature);
  return (relativeHumidity / 100) * satPressure;
}

/**
 * Calculate saturation vapor pressure at temperature
 *
 * @param temperature - Temperature in Celsius
 * @returns Saturation pressure in Pascals
 */
function calculateSaturationPressure(temperature: number): number {
  const exponent = (7.5 * temperature) / (237.3 + temperature);
  return 610.7 * Math.pow(10, exponent);
}

/**
 * Check for condensation risk in wall assembly
 *
 * Compares interface temperatures against dew point to identify
 * layers where condensation may occur.
 *
 * @param temperatures - Array of temperatures at each interface
 * @param dewPoint - Dew point temperature
 * @param components - Array of wall components
 * @returns Condensation risk assessment
 */
export function checkCondensationRisk(
  temperatures: number[],
  dewPoint: number,
  components: WallComponent[],
  insideRH: number,
  outsideRH: number
): CondensationRisk {
  const riskLayers: number[] = [];
  const saturationPoints: number[] = [];
  let hasRisk = false;

  // Check each interface for condensation risk
  for (let i = 1; i < temperatures.length; i++) {
    const temp = temperatures[i];
    const rh = interpolateRelativeHumidity(insideRH, outsideRH, i, temperatures.length);
    const satPressure = calculateSaturationPressure(temp);
    const actualPressure = (rh / 100) * satPressure;

    // Check if vapor pressure exceeds saturation (condensation)
    if (actualPressure >= satPressure) {
      hasRisk = true;
      riskLayers.push(i - 1); // Component before this interface
      saturationPoints.push(i);
    }

    // Check if temperature is within condensation risk threshold of dew point
    if (temp <= dewPoint + 2 && !riskLayers.includes(i - 1)) {
      riskLayers.push(i - 1);
      hasRisk = true;
    }
  }

  return {
    hasRisk,
    riskLayers,
    vaporPressureRisk: saturationPoints.length > 0,
    saturationPoints
  };
}

/**
 * Find position in wall where dew point occurs
 *
 * Linearly interpolates between temperature points to find
 * exact position where temperature equals dew point.
 *
 * @param components - Array of wall components
 * @param insideTemp - Indoor temperature in Celsius
 * @param outsideTemp - Outdoor temperature in Celsius
 * @param dewPoint - Dew point temperature
 * @param studWallType - Stud wall type
 * @returns Position from inside surface in meters, or null if dew point not in range
 */
export function findDewPointPosition(
  components: WallComponent[],
  insideTemp: number,
  outsideTemp: number,
  dewPoint: number,
  _studWallType: StudWallType
): number | null {
  const temperatures = calculateTemperatures(components, insideTemp, outsideTemp, _studWallType);

  // Check if dew point is within temperature range
  if (dewPoint > Math.max(...temperatures) || dewPoint < Math.min(...temperatures)) {
    return null;
  }

  // Find interface where dew point occurs
  for (let i = 0; i < temperatures.length - 1; i++) {
    const t1 = temperatures[i];
    const t2 = temperatures[i + 1];

    // Check if dew point is between these two temperatures
    if ((t1 >= dewPoint && t2 <= dewPoint) || (t1 <= dewPoint && t2 >= dewPoint)) {
      // Linearly interpolate to find exact position
      const fraction = (dewPoint - t1) / (t2 - t1);
      const layerThickness = components[i].thickness * MM_TO_M;
      const cumulativeThickness = components.slice(0, i).reduce((sum, c) => sum + c.thickness * MM_TO_M, 0);

      return cumulativeThickness + (layerThickness * fraction);
    }
  }

  return null;
}

/**
 * Get detailed temperature data points for visualization
 *
 * @param components - Array of wall components
 * @param insideTemp - Indoor temperature in Celsius
 * @param outsideTemp - Outdoor temperature in Celsius
 * @param studWallType - Stud wall type
 * @returns Array of temperature data points with position and material info
 */
export function getTemperatureDataPoints(
  components: WallComponent[],
  insideTemp: number,
  outsideTemp: number,
  studWallType: StudWallType
): TemperatureDataPoint[] {
  const temperatures = calculateTemperatures(components, insideTemp, outsideTemp, studWallType);
  const points: TemperatureDataPoint[] = [
    { position: 0, temperature: insideTemp, material: 'Inside' }
  ];

  let cumulativeThickness = 0;
  for (let i = 0; i < components.length; i++) {
    cumulativeThickness += components[i].thickness * MM_TO_M;
    points.push({
      position: cumulativeThickness,
      temperature: temperatures[i + 1],
      material: components[i].material
    });
  }

  return points;
}

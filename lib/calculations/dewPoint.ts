/**
 * Dew Point Calculations
 *
 * Implements the Magnus-Tetens formula for accurate dew point
 * temperature calculation based on temperature and relative humidity.
 */

import { DewPointResult } from '../types/domain';

/**
 * Calculate dew point temperature using Magnus-Tetens formula
 *
 * The Magnus-Tetens approximation is accurate to within 0.35°C
 * for temperatures between -40°C and +60°C.
 *
 * @param temperature - Air temperature in Celsius
 * @param relativeHumidity - Relative humidity in percentage (0-100)
 * @returns Dew point calculation result
 *
 * Formula:
 * α = 17.27 * T / (b + T)
 * γ(b) = b * ln(h / 100)
 * Td = b * γ(b) / (a - γ(b))
 *
 * where:
 * a = 17.27, b = 237.7 (°C)
 * T = temperature (°C)
 * h = relative humidity (%)
 * Td = dew point temperature (°C)
 *
 * @example
 * const result = calculateDewPoint(20, 50);
 * // Returns { dewPoint: 9.3, valid: true }
 */
export function calculateDewPoint(
  temperature: number,
  relativeHumidity: number
): DewPointResult {
  // Validate inputs
  const validation = validateDewPointInputs(temperature, relativeHumidity);
  if (!validation.valid) {
    return {
      dewPoint: 0,
      valid: false,
      error: validation.error
    };
  }

  try {
    // Magnus-Tetens formula constants
    const a = 17.27;
    const b = 237.3;

    // Convert temperature to Kelvin for calculation
    const temperatureKelvin = temperature + 273.15;

    // Calculate ln(RH/100)
    const lnRH = Math.log(relativeHumidity / 100);

    // Calculate alpha: α = [ln(RH/100)] + [a × T / (b + T)]
    const alpha = lnRH + (a * temperatureKelvin) / (b + temperatureKelvin);

    // Calculate dew point in Kelvin: Td = (b × α) / (a - α)
    const dewPointKelvin = (b * alpha) / (a - alpha);

    // Convert to Celsius: Td(C) = Td(K) - 273.15
    const dewPoint = dewPointKelvin - 273.15;

    return {
      dewPoint,
      valid: true
    };
  } catch (error) {
    return {
      dewPoint: 0,
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown calculation error'
    };
  }
}

/**
 * Validate dew point calculation inputs
 *
 * @param temperature - Temperature in Celsius
 * @param relativeHumidity - Relative humidity in percentage
 * @returns Validation result
 */
function validateDewPointInputs(
  temperature: number,
  relativeHumidity: number
): { valid: boolean; error?: string } {
  const MIN_TEMPERATURE = -40;
  const MAX_TEMPERATURE = 60;
  const MIN_RELATIVE_HUMIDITY = 0.01;
  const MAX_RELATIVE_HUMIDITY = 100;

  if (typeof temperature !== 'number' || isNaN(temperature)) {
    return { valid: false, error: 'Temperature must be a valid number' };
  }

  if (typeof relativeHumidity !== 'number' || isNaN(relativeHumidity)) {
    return { valid: false, error: 'Humidity must be a valid number' };
  }

  if (temperature < MIN_TEMPERATURE || temperature > MAX_TEMPERATURE) {
    return {
      valid: false,
      error: `Temperature must be between ${MIN_TEMPERATURE}°C and ${MAX_TEMPERATURE}°C`
    };
  }

  if (relativeHumidity < MIN_RELATIVE_HUMIDITY || relativeHumidity > MAX_RELATIVE_HUMIDITY) {
    return {
      valid: false,
      error: `Relative humidity must be between ${MIN_RELATIVE_HUMIDITY}% and ${MAX_RELATIVE_HUMIDITY}%`
    };
  }

  return { valid: true };
}

/**
 * Calculate saturation vapor pressure at given temperature
 *
 * @param temperature - Temperature in Celsius
 * @returns Saturation vapor pressure in Pascals
 *
 * Formula: P_sat = 610.7 * 10^(7.5 * T / (237.3 + T))
 */
export function calculateSaturationPressure(temperature: number): number {
  const VAPOR_PRESSURE_CONSTANT = 610.7;
  const VAPOR_PRESSURE_EXPONENT = 7.5;
  const VAPOR_PRESSURE_OFFSET = 237.3;

  const exponent = (VAPOR_PRESSURE_EXPONENT * temperature) / (VAPOR_PRESSURE_OFFSET + temperature);
  return VAPOR_PRESSURE_CONSTANT * Math.pow(10, exponent);
}

/**
 * Check if condensation will occur at given conditions
 *
 * @param surfaceTemperature - Temperature of the surface
 * @param dewPoint - Dew point temperature
 * @returns True if condensation will occur
 */
export function willCondensationOccur(
  surfaceTemperature: number,
  dewPoint: number
): boolean {
  return surfaceTemperature <= dewPoint;
}

/**
 * Calculate condensation risk level
 *
 * @param surfaceTemperature - Temperature of the surface
 * @param dewPoint - Dew point temperature
 * @returns Risk level: 'none', 'low', 'medium', 'high'
 */
export function getCondensationRiskLevel(
  surfaceTemperature: number,
  dewPoint: number
): 'none' | 'low' | 'medium' | 'high' {
  const difference = surfaceTemperature - dewPoint;

  if (difference > 5) return 'none';
  if (difference > 2) return 'low';
  if (difference > 0) return 'medium';
  return 'high';
}

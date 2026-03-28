/**
 * Calculation-related constants
 *
 * Physical constants and calculation parameters used in thermal analysis.
 */

/**
 * Maximum number of wall layers allowed
 */
export const MAX_LAYERS = 8 as const;

/**
 * Minimum temperature for calculations in Celsius
 */
export const MIN_TEMPERATURE = -40 as const;

/**
 * Maximum temperature for calculations in Celsius
 */
export const MAX_TEMPERATURE = 60 as const;

/**
 * Minimum relative humidity in percent
 */
export const MIN_RELATIVE_HUMIDITY = 0.01 as const;

/**
 * Maximum relative humidity in percent
 */
export const MAX_RELATIVE_HUMIDITY = 100 as const;

/**
 * Conversion factor from millimeters to meters
 */
export const MM_TO_M = 0.001 as const;

/**
 * Conversion factor from meters to millimeters
 */
export const M_TO_MM = 1000 as const;

/**
 * Standard indoor temperature in Celsius for default calculations
 */
export const STANDARD_INDOOR_TEMP = 20 as const;

/**
 * Standard outdoor temperature in Celsius for default calculations
 */
export const STANDARD_OUTDOOR_TEMP = 5 as const;

/**
 * Standard indoor relative humidity for default calculations
 */
export const STANDARD_INDOOR_RH = 50 as const;

/**
 * Standard outdoor relative humidity for default calculations
 */
export const STANDARD_OUTDOOR_RH = 80 as const;

/**
 * Magnus-Tetens constants for dew point calculation
 *
 * These constants are used in the formula:
 * a = 17.27, b = 237.7 (°C)
 * α = 17.27 * T / (b + T)
 * γ(b) = b * ln(h / 100)
 * Td = b * γ(b) / (a - γ(b))
 */
export const MAGNUS_A = 17.27 as const;
export const MAGNUS_B = 237.7 as const;

/**
 * Vapor pressure constant for saturation calculation
 *
 * Used in: P_sat = 610.7 * 10^(7.5 * T / (237.3 + T))
 */
export const VAPOR_PRESSURE_CONSTANT = 610.7 as const;
export const VAPOR_PRESSURE_EXPONENT = 7.5 as const;
export const VAPOR_PRESSURE_OFFSET = 237.3 as const;

/**
 * Condensation risk threshold in degrees Celsius
 *
 * If dew point is within this threshold of any layer temperature,
 * condensation risk is flagged.
 */
export const CONDENSATION_RISK_THRESHOLD = 2.0 as const;

/**
 * Temperature difference threshold for extreme condition warning
 *
 * If indoor-outdoor temp difference exceeds this with high humidity,
 * show warning.
 */
export const EXTREME_TEMP_DIFF_THRESHOLD = 20 as const;

/**
 * High humidity threshold for extreme conditions
 */
export const HIGH_HUMIDITY_THRESHOLD = 35 as const;

/**
 * Standard air film resistance values (m²K/W)
 *
 * Internal and external surface resistances from ISO 6946
 */
export const INTERNAL_FILM_RESISTANCE = 0.13 as const;
export const EXTERNAL_FILM_RESISTANCE = 0.04 as const;

/**
 * Total air film resistance
 */
export const TOTAL_AIR_FILM_RESISTANCE = INTERNAL_FILM_RESISTANCE + EXTERNAL_FILM_RESISTANCE;

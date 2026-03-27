/**
 * Domain types for Wall U-Value Calculator
 *
 * These types represent the core domain model for wall assembly calculations,
 * separate from UI-specific types.
 */

/**
 * Represents a single component/layers in a wall assembly
 */
export interface WallComponent {
  /** Unique identifier for the component */
  id: number;
  /** Material name (must match material database) */
  material: string;
  /** Thickness of the component in millimeters */
  thickness: number;
  /** Thermal conductivity (λ) in W/mK */
  conductivity: number;
  /** Whether this component provides insulation */
  isInsulation: boolean;
  /** Whether studs run through this component (for stud walls) */
  hasStuds?: boolean;
  /** Vapor resistance factor (μ-value) */
  vaporResistance?: number;
}

/**
 * Stud wall type configuration
 */
export type StudWallType = 'none' | 'standard' | 'i-joist';

/**
 * Configuration for stud wall parameters
 */
export interface StudWallConfig {
  /** Type of stud wall */
  type: StudWallType;
  /** Width of stud in millimeters */
  studWidth: number;
  /** Depth of stud cavity in millimeters */
  studDepth: number;
  /** Spacing between studs center-to-center in millimeters */
  studSpacing: number;
  /** Thermal conductivity of stud material in W/mK */
  studConductivity: number;
  /** Percentage of wall area occupied by studs (0-1) */
  studArea: number;
}

/**
 * Material properties used in calculations
 */
export interface Material {
  /** Display name of the material */
  name: string;
  /** Thermal conductivity (λ) - can be range or specific value */
  conductivity: number;
  /** Color code for visualization */
  color: string;
  /** Cost per square meter per millimeter thickness */
  cost: number;
  /** Whether material provides insulation */
  isInsulation: boolean;
  /** Vapor resistance factor (μ) - higher means more resistant */
  vaporResistance: number;
}

/**
 * Example wall assembly configuration
 */
export interface ExampleWall {
  /** Display name for the preset */
  name: string;
  /** Components in the wall assembly */
  components: Omit<WallComponent, 'id'>[];
  /** Stud wall type (if applicable) */
  studWallType: StudWallType;
  /** I-joist depth for i-joist walls */
  iJoistDepth?: number;
}

/**
 * Temperature data point for gradient analysis
 */
export interface TemperatureDataPoint {
  /** Position from inside surface in meters */
  position: number;
  /** Temperature at this position in Celsius */
  temperature: number;
  /** Material name at this position */
  material: string;
}

/**
 * Vapor pressure data point for moisture analysis
 */
export interface VaporPressureDataPoint {
  /** Position from inside surface in meters */
  position: number;
  /** Vapor pressure in Pascals */
  vaporPressure: number;
  /** Saturation vapor pressure at this temperature */
  saturationPressure: number;
}

/**
 * Condensation risk assessment result
 */
export interface CondensationRisk {
  /** Whether condensation risk exists */
  hasRisk: boolean;
  /** Indices of layers with condensation risk */
  riskLayers: number[];
  /** Whether vapor pressure exceeds saturation anywhere */
  vaporPressureRisk: boolean;
  /** Positions where saturation occurs */
  saturationPoints: number[];
}

/**
 * Dew point calculation result
 */
export interface DewPointResult {
  /** Dew point temperature in Celsius */
  dewPoint: number;
  /** Whether calculation was successful */
  valid: boolean;
  /** Error message if calculation failed */
  error?: string;
}

/**
 * Thermal performance metrics
 */
export interface ThermalPerformance {
  /** Total thermal resistance in m²K/W */
  totalRValue: number;
  /** Overall thermal transmittance in W/m²K */
  uValue: number;
  /** Total cost per square meter */
  totalCost: number;
  /** Cost effectiveness ratio (R-value per dollar) */
  costEffectiveness: number;
}

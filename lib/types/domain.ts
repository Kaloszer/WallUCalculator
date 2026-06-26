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

/**
 * Extended material with metadata for storage
 */
export interface MaterialExtended extends Material {
  /** Unique identifier for the material */
  id: string;
  /** Category of material (insulation, structural, sheathing, etc.) */
  category: string;
  /** Source of material data (user-defined, database, etc.) */
  source: 'database' | 'user' | 'manufacturer';
  /** Manufacturer name (if applicable) */
  manufacturer?: string;
  /** Product code or reference */
  productCode?: string;
  /** When the material was created/added */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
  /** Additional notes or specifications */
  notes?: string;
}

/**
 * Filter parameters for material queries
 */
export interface MaterialFilter {
  /** Search query for material name */
  query?: string;
  /** Filter by category */
  category?: string;
  /** Filter by insulation status */
  isInsulation?: boolean;
  /** Filter by source */
  source?: 'database' | 'user' | 'manufacturer';
  /** Minimum conductivity value */
  minConductivity?: number;
  /** Maximum conductivity value */
  maxConductivity?: number;
  /** Minimum cost value */
  minCost?: number;
  /** Maximum cost value */
  maxCost?: number;
  /** Filter by manufacturer */
  manufacturer?: string;
}

/**
 * Result of material query operation
 */
export interface MaterialQueryResult {
  /** Array of matching materials */
  materials: MaterialExtended[];
  /** Total count of results */
  total: number;
  /** Current page number */
  page: number;
  /** Results per page */
  pageSize: number;
}

/**
 * Climate zone classification (numeric 1-8 per building codes)
 */
export type ClimateZone = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Climate zone descriptions for display
 */
export const CLIMATE_ZONE_LABELS: Record<ClimateZone, string> = {
  1: 'Very Hot - Humid (HDD < 2000)',
  2: 'Hot - Humid (HDD 2000-3000)',
  3: 'Mixed - Humid (HDD 3000-4000)',
  4: 'Mixed - Humid/Hot-Dry (HDD 4000-5000)',
  5: 'Cool (HDD 5000-6000)',
  6: 'Cold (HDD 6000-7000)',
  7: 'Very Cold (HDD 7000-8000)',
  8: 'Subarctic/Arctic (HDD > 8000)',
};

/**
 * Geographic location data
 */
export interface Location {
  /** Country name */
  country: string;
  /** Region/state/province */
  region: string;
  /** City name */
  city: string;
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lon: number;
  /** Timezone identifier */
  timezone: string;
  /** Climate zone classification */
  climateZone: ClimateZone;
}

/**
 * Climate data for calculations
 */
export interface ClimateData {
  /** Location reference */
  location: Location;
  /** Annual average temperature in Celsius */
  annualAvgTemp: number;
  /** Winter design temperature (99.6%) in Celsius */
  winterDesignTemp: number;
  /** Summer design temperature (1%) in Celsius */
  summerDesignTemp: number;
  /** Annual heating degree days (base 18°C) */
  heatingDegreeDays: number;
  /** Annual cooling degree days (base 24°C) */
  coolingDegreeDays: number;
  /** Annual average relative humidity (%) */
  avgHumidity: number;
  /** Typical winter humidity (%) */
  winterHumidity: number;
  /** Typical summer humidity (%) */
  summerHumidity: number;
  /** Wind exposure category */
  windExposure: 'sheltered' | 'normal' | 'exposed';
}

/**
 * Reference to building code requirements
 */
export interface BuildingCodeReference {
  /** Code name (e.g., "National Building Code 2020") */
  codeName: string;
  /** Code edition or year */
  edition: string;
  /** Country or region code */
  jurisdiction: string;
  /** Section reference */
  section?: string;
  /** URL to documentation */
  url?: string;
}

/**
 * Hygroscopic material properties
 */
export interface HygroscopicProperties {
  /** Sorption curve data points */
  sorptionCurve: Array<{
    /** Relative humidity (%) */
    rh: number;
    /** Equilibrium moisture content (kg/kg) */
    emc: number;
  }>;
  /** Diffusion resistance factor */
  diffusionResistance: number;
  /** Permeability (kg/(m·s·Pa)) */
  permeability?: number;
}

/**
 * Moisture simulation parameters and results
 */
export interface MoistureSimulation {
  /** Simulation method used */
  method: 'glaser' | 'hygric' | 'wufi';
  /** Internal climate parameters */
  internalClimate: {
    /** Temperature (°C) */
    temperature: number;
    /** Relative humidity (%) */
    humidity: number;
  };
  /** External climate parameters */
  externalClimate: {
    /** Temperature (°C) */
    temperature: number;
    /** Relative humidity (%) */
    humidity: number;
  };
  /** Glaser diagram points (if method is glaser) */
  glaserPoints?: GlaserPoint[];
  /** Condensation risk assessment */
  condensationRisk: CondensationRisk;
  /** Dew point calculation */
  dewPoint: DewPointResult;
}

/**
 * Point on Glaser diagram
 */
export interface GlaserPoint {
  /** Position from interior surface (m) */
  position: number;
  /** Temperature at this point (°C) */
  temperature: number;
  /** Vapor pressure (Pa) */
  vaporPressure: number;
  /** Saturation vapor pressure (Pa) */
  saturationPressure: number;
  /** Layer index */
  layerIndex: number;
}

/**
 * Compliance standard type
 */
export type ComplianceStandard =
  | 'ASHRAE_90_1'
  | 'IECC_2021'
  | 'IECC_2018'
  | 'ISO_6946'
  | 'EN_12831'
  | 'BC_BC_2018'
  | 'NBC_Canada_2020'
  | 'EU_2018_844'
  | 'custom';

/**
 * Compliance check result
 */
export interface ComplianceResult {
  /** Whether the assembly is compliant */
  compliant: boolean;
  /** Standard being checked */
  standard: ComplianceStandard;
  /** Maximum allowed U-value */
  maxUValue: number;
  /** Calculated U-value */
  actualUValue: number;
  /** Percentage of requirement met */
  percentageOfRequirement: number;
  /** Specific compliance checks */
  checks: ComplianceCheck[];
  /** Overall violations */
  violations: ComplianceViolation[];
  /** Recommendation for improvement */
  recommendation?: string;
}

/**
 * Individual compliance check
 */
export interface ComplianceCheck {
  /** Check identifier */
  id: string;
  /** Description of what is being checked */
  description: string;
  /** Whether this check passed */
  passed: boolean;
  /** Expected value */
  expected: number | string;
  /** Actual value */
  actual: number | string;
  /** Unit of measurement */
  unit?: string;
}

/**
 * Compliance violation detail
 */
export interface ComplianceViolation {
  /** Violation type */
  type: 'u_value' | 'r_value' | 'moisture' | 'structural' | 'other';
  /** Severity level */
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  /** Description of the violation */
  description: string;
  /** Reference to code requirement */
  codeReference?: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Code requirements for a given standard
 */
export interface CodeRequirements {
  /** Compliance standard */
  standard: ComplianceStandard;
  /** Building type */
  buildingType: 'residential' | 'commercial' | 'institutional' | 'industrial';
  /** Climate zone */
  climateZone: ClimateZone;
  /** Maximum allowed U-value (W/m²K) */
  maxUValue: number;
  /** Minimum required R-value (m²K/W) */
  minRValue: number;
  /** Required vapor control measures */
  vaporControl: string;
  /** Required air barrier requirements */
  airBarrier: string;
  /** Additional requirements */
  additionalRequirements: string[];
  /** Code references */
  references: BuildingCodeReference[];
}

/**
 * Saved wall assembly with metadata
 */
export interface SavedWallAssembly {
  /** Unique identifier */
  id: string;
  /** Assembly name */
  name: string;
  /** Description of the assembly */
  description?: string;
  /** Components in the assembly */
  components: WallComponent[];
  /** Stud wall configuration */
  studWallConfig?: StudWallConfig;
  /** Calculated performance metrics */
  performance: ThermalPerformance;
  /** Compliance results */
  compliance?: ComplianceResult[];
  /** When the assembly was created */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
  /** User-provided tags */
  tags: string[];
  /** Whether this is a favorite/template */
  isTemplate: boolean;
  /** Whether this is marked as favorite */
  isFavorite?: boolean;
  /** Notes about the assembly */
  notes?: string;
}

/**
 * Comparison result between assemblies
 */
export interface ComparisonResult {
  /** Reference assembly ID */
  referenceAssemblyId: string;
  /** Assembly being compared */
  comparisonAssemblyId: string;
  /** Performance comparison */
  performance: PerformanceComparison;
  /** Cost comparison */
  cost: CostComparison;
  /** Overall recommendation */
  recommendation: ComparisonRecommendation;
  /** When the comparison was created */
  createdAt: string;
}

/**
 * Performance comparison metrics
 */
export interface PerformanceComparison {
  /** U-value difference */
  uValueDifference: number;
  /** R-value difference */
  rValueDifference: number;
  /** Percentage improvement/degradation */
  percentageChange: number;
  /** Which assembly is better */
  betterAssembly: 'reference' | 'comparison' | 'equal';
}

/**
 * Cost comparison metrics
 */
export interface CostComparison {
  /** Cost difference per m² */
  costDifference: number;
  /** Cost-effectiveness comparison */
  costEffectivenessRatio: number;
  /** Payback period estimate (years) */
  paybackPeriod?: number;
  /** Cost per R-value comparison */
  costPerRValue: {
    reference: number;
    comparison: number;
  };
}

/**
 * Comparison recommendation
 */
export interface ComparisonRecommendation {
  /** Recommended assembly */
  recommendedAssemblyId: string;
  /** Recommendation reason */
  reason: string;
  /** Key advantages */
  advantages: string[];
  /** Potential trade-offs */
  tradeoffs: string[];
}

/**
 * Report configuration options
 */
export interface ReportConfig {
  /** Report title */
  title: string;
  /** Branding information */
  branding: ReportBranding;
  /** What sections to include */
  includeSections: {
    /** Include executive summary */
    summary: boolean;
    /** Include technical specifications */
    specifications: boolean;
    /** Include performance metrics */
    performance: boolean;
    /** Include compliance information */
    compliance: boolean;
    /** Include cost analysis */
    cost: boolean;
    /** Include recommendations */
    recommendations: boolean;
  };
  /** Level of detail */
  detailLevel: 'basic' | 'standard' | 'detailed';
  /** Include calculations in appendix */
  includeCalculations: boolean;
  /** Include diagrams */
  includeDiagrams: boolean;
  /** Custom footer text */
  footerText?: string;
}

/**
 * Report branding configuration
 */
export interface ReportBranding {
  /** Company/organization name */
  companyName?: string;
  /** Logo URL or base64 */
  logoUrl?: string;
  /** Primary color (hex) */
  primaryColor: string;
  /** Secondary color (hex) */
  secondaryColor: string;
  /** Contact information */
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

/**
 * Export format type
 */
export type ExportFormat = 'pdf' | 'excel' | 'json' | 'csv';

/**
 * Export data structure
 */
export interface ExportData {
  /** Assembly data */
  assembly: SavedWallAssembly;
  /** Export configuration */
  config: ReportConfig;
  /** Export format */
  format: ExportFormat;
  /** When the export was generated */
  generatedAt: string;
  /** Additional metadata */
  metadata?: {
    /** Export version */
    version: string;
    /** Application name */
    application: string;
    /** User identifier */
    userId?: string;
  };
}

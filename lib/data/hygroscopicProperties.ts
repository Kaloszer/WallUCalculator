/**
 * Hygroscopic Properties Data
 *
 * Contains sorption curve data for insulation materials.
 * Sorption curves describe how moisture content changes with relative humidity.
 */

/**
 * Sorption curve data point
 */
export interface SorptionPoint {
  /** Relative humidity in percentage */
  relativeHumidity: number;
  /** Moisture content in percentage of dry mass */
  moistureContent: number;
}

/**
 * Hygroscopic properties for a material
 */
export interface HygroscopicProperties {
  /** Material name */
  material: string;
  /** Sorption curve data points */
  sorptionCurve: SorptionPoint[];
  /** Maximum safe moisture content before damage occurs (%) */
  maxSafeMoistureContent: number;
  /** Vapor diffusion resistance factor (μ-value) */
  vaporDiffusionResistance: number;
  /** Drying potential factor (higher = faster drying) */
  dryingFactor: number;
  /** Material density in kg/m³ */
  density: number;
}

/**
 * Get moisture content at a given relative humidity for a material
 *
 * Interpolates between sorption curve data points.
 *
 * @param material - Material name
 * @param relativeHumidity - Relative humidity in percentage
 * @returns Moisture content in percentage
 */
export function getMoistureContent(
  material: string,
  relativeHumidity: number
): number {
  const properties = getHygroscopicProperties(material);
  if (!properties) return 0;

  const curve = properties.sorptionCurve;

  // Find surrounding data points for interpolation
  let lowerPoint = curve[0];
  let upperPoint = curve[curve.length - 1];

  for (let i = 0; i < curve.length - 1; i++) {
    if (curve[i].relativeHumidity <= relativeHumidity &&
        curve[i + 1].relativeHumidity >= relativeHumidity) {
      lowerPoint = curve[i];
      upperPoint = curve[i + 1];
      break;
    }
  }

  // Linear interpolation
  if (upperPoint.relativeHumidity === lowerPoint.relativeHumidity) {
    return lowerPoint.moistureContent;
  }

  const ratio = (relativeHumidity - lowerPoint.relativeHumidity) /
                (upperPoint.relativeHumidity - lowerPoint.relativeHumidity);
  return lowerPoint.moistureContent +
         ratio * (upperPoint.moistureContent - lowerPoint.moistureContent);
}

/**
 * Get complete hygroscopic properties for a material
 *
 * @param material - Material name
 * @returns Hygroscopic properties or null if not found
 */
export function getHygroscopicProperties(
  material: string
): HygroscopicProperties | null {
  const materialLower = material.toLowerCase();
  return hygroscopicDatabase.find(
    props => props.material.toLowerCase() === materialLower
  ) || null;
}

/**
 * Check if material exceeds safe moisture content
 *
 * @param material - Material name
 * @param currentMoistureContent - Current moisture content in percentage
 * @returns True if exceeding safe limits
 */
export function isMoistureContentExceeded(
  material: string,
  currentMoistureContent: number
): boolean {
  const properties = getHygroscopicProperties(material);
  if (!properties) return false;

  return currentMoistureContent > properties.maxSafeMoistureContent;
}

/**
 * Calculate drying rate for a material
 *
 * @param material - Material name
 * @param temperature - Temperature in Celsius
 * @param relativeHumidity - Relative humidity in percentage
 * @returns Drying rate in kg/m² per day
 */
export function calculateDryingRate(
  material: string,
  temperature: number,
  relativeHumidity: number
): number {
  const properties = getHygroscopicProperties(material);
  if (!properties) return 0;

  const equilibriumMoisture = getMoistureContent(material, relativeHumidity);

  // Simplified drying model based on temperature and drying factor
  const temperatureFactor = Math.exp((temperature - 20) / 10);
  const diffusionFactor = 1 / properties.vaporDiffusionResistance;

  return properties.dryingFactor * diffusionFactor * temperatureFactor *
         Math.abs(equilibriumMoisture * 0.01); // kg/m²/day
}

/**
 * Hygroscopic properties database for common insulation materials
 *
 * Data sources:
 * - EN 12524 standard for building materials
 * - ASHRAE Handbook of Fundamentals
 * - Manufacturer technical specifications
 */
const hygroscopicDatabase: HygroscopicProperties[] = [
  {
    material: 'Mineral Wool',
    sorptionCurve: [
      { relativeHumidity: 0, moistureContent: 0.0 },
      { relativeHumidity: 30, moistureContent: 0.5 },
      { relativeHumidity: 50, moistureContent: 1.0 },
      { relativeHumidity: 70, moistureContent: 1.8 },
      { relativeHumidity: 90, moistureContent: 3.0 },
      { relativeHumidity: 100, moistureContent: 5.0 },
    ],
    maxSafeMoistureContent: 2.0,
    vaporDiffusionResistance: 1.0,
    dryingFactor: 0.8,
    density: 30,
  },
  {
    material: 'Cellulose Fiber',
    sorptionCurve: [
      { relativeHumidity: 0, moistureContent: 0.0 },
      { relativeHumidity: 30, moistureContent: 3.0 },
      { relativeHumidity: 50, moistureContent: 8.0 },
      { relativeHumidity: 70, moistureContent: 15.0 },
      { relativeHumidity: 90, moistureContent: 25.0 },
      { relativeHumidity: 100, moistureContent: 35.0 },
    ],
    maxSafeMoistureContent: 15.0,
    vaporDiffusionResistance: 2.0,
    dryingFactor: 0.6,
    density: 50,
  },
  {
    material: 'Fiberglass',
    sorptionCurve: [
      { relativeHumidity: 0, moistureContent: 0.0 },
      { relativeHumidity: 30, moistureContent: 0.2 },
      { relativeHumidity: 50, moistureContent: 0.5 },
      { relativeHumidity: 70, moistureContent: 1.0 },
      { relativeHumidity: 90, moistureContent: 2.0 },
      { relativeHumidity: 100, moistureContent: 4.0 },
    ],
    maxSafeMoistureContent: 1.5,
    vaporDiffusionResistance: 1.2,
    dryingFactor: 0.9,
    density: 12,
  },
  {
    material: 'XPS (Extruded Polystyrene)',
    sorptionCurve: [
      { relativeHumidity: 0, moistureContent: 0.0 },
      { relativeHumidity: 30, moistureContent: 0.05 },
      { relativeHumidity: 50, moistureContent: 0.1 },
      { relativeHumidity: 70, moistureContent: 0.2 },
      { relativeHumidity: 90, moistureContent: 0.35 },
      { relativeHumidity: 100, moistureContent: 0.5 },
    ],
    maxSafeMoistureContent: 0.3,
    vaporDiffusionResistance: 80.0,
    dryingFactor: 0.3,
    density: 30,
  },
  {
    material: 'EPS (Expanded Polystyrene)',
    sorptionCurve: [
      { relativeHumidity: 0, moistureContent: 0.0 },
      { relativeHumidity: 30, moistureContent: 0.1 },
      { relativeHumidity: 50, moistureContent: 0.3 },
      { relativeHumidity: 70, moistureContent: 0.6 },
      { relativeHumidity: 90, moistureContent: 1.0 },
      { relativeHumidity: 100, moistureContent: 1.5 },
    ],
    maxSafeMoistureContent: 0.8,
    vaporDiffusionResistance: 30.0,
    dryingFactor: 0.4,
    density: 20,
  },
  {
    material: 'Polyurethane Foam',
    sorptionCurve: [
      { relativeHumidity: 0, moistureContent: 0.0 },
      { relativeHumidity: 30, moistureContent: 0.05 },
      { relativeHumidity: 50, moistureContent: 0.1 },
      { relativeHumidity: 70, moistureContent: 0.2 },
      { relativeHumidity: 90, moistureContent: 0.35 },
      { relativeHumidity: 100, moistureContent: 0.5 },
    ],
    maxSafeMoistureContent: 0.4,
    vaporDiffusionResistance: 50.0,
    dryingFactor: 0.35,
    density: 35,
  },
  {
    material: 'Sheep Wool',
    sorptionCurve: [
      { relativeHumidity: 0, moistureContent: 0.0 },
      { relativeHumidity: 30, moistureContent: 8.0 },
      { relativeHumidity: 50, moistureContent: 14.0 },
      { relativeHumidity: 70, moistureContent: 22.0 },
      { relativeHumidity: 90, moistureContent: 30.0 },
      { relativeHumidity: 100, moistureContent: 35.0 },
    ],
    maxSafeMoistureContent: 18.0,
    vaporDiffusionResistance: 1.5,
    dryingFactor: 0.7,
    density: 25,
  },
  {
    material: 'Hemp Fiber',
    sorptionCurve: [
      { relativeHumidity: 0, moistureContent: 0.0 },
      { relativeHumidity: 30, moistureContent: 5.0 },
      { relativeHumidity: 50, moistureContent: 10.0 },
      { relativeHumidity: 70, moistureContent: 16.0 },
      { relativeHumidity: 90, moistureContent: 24.0 },
      { relativeHumidity: 100, moistureContent: 30.0 },
    ],
    maxSafeMoistureContent: 15.0,
    vaporDiffusionResistance: 2.5,
    dryingFactor: 0.65,
    density: 40,
  },
  {
    material: 'Cork',
    sorptionCurve: [
      { relativeHumidity: 0, moistureContent: 0.0 },
      { relativeHumidity: 30, moistureContent: 3.0 },
      { relativeHumidity: 50, moistureContent: 6.0 },
      { relativeHumidity: 70, moistureContent: 10.0 },
      { relativeHumidity: 90, moistureContent: 15.0 },
      { relativeHumidity: 100, moistureContent: 20.0 },
    ],
    maxSafeMoistureContent: 12.0,
    vaporDiffusionResistance: 5.0,
    dryingFactor: 0.55,
    density: 120,
  },
  {
    material: 'Wood Fiber Board',
    sorptionCurve: [
      { relativeHumidity: 0, moistureContent: 0.0 },
      { relativeHumidity: 30, moistureContent: 5.0 },
      { relativeHumidity: 50, moistureContent: 9.0 },
      { relativeHumidity: 70, moistureContent: 14.0 },
      { relativeHumidity: 90, moistureContent: 20.0 },
      { relativeHumidity: 100, moistureContent: 25.0 },
    ],
    maxSafeMoistureContent: 16.0,
    vaporDiffusionResistance: 3.0,
    dryingFactor: 0.6,
    density: 250,
  },
  {
    material: 'Perlite (Expanded)',
    sorptionCurve: [
      { relativeHumidity: 0, moistureContent: 0.0 },
      { relativeHumidity: 30, moistureContent: 0.3 },
      { relativeHumidity: 50, moistureContent: 0.7 },
      { relativeHumidity: 70, moistureContent: 1.2 },
      { relativeHumidity: 90, moistureContent: 2.0 },
      { relativeHumidity: 100, moistureContent: 3.0 },
    ],
    maxSafeMoistureContent: 1.5,
    vaporDiffusionResistance: 3.5,
    dryingFactor: 0.7,
    density: 100,
  },
  {
    material: 'Vermiculite',
    sorptionCurve: [
      { relativeHumidity: 0, moistureContent: 0.0 },
      { relativeHumidity: 30, moistureContent: 2.0 },
      { relativeHumidity: 50, moistureContent: 4.0 },
      { relativeHumidity: 70, moistureContent: 7.0 },
      { relativeHumidity: 90, moistureContent: 11.0 },
      { relativeHumidity: 100, moistureContent: 15.0 },
    ],
    maxSafeMoistureContent: 8.0,
    vaporDiffusionResistance: 2.5,
    dryingFactor: 0.6,
    density: 80,
  },
];

/**
 * Get all available materials with hygroscopic data
 *
 * @returns Array of material names
 */
export function getAvailableHygroscopicMaterials(): string[] {
  return hygroscopicDatabase.map(props => props.material);
}

/**
 * Export the complete database for advanced usage
 */
export { hygroscopicDatabase };

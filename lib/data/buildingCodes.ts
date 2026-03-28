/**
 * Building Code Requirements Database
 *
 * Contains U-value requirements for various building codes and climate zones.
 * Data sources: ASHRAE 90.1, IECC 2021, ISO 6946, EN 12831
 */

/**
 * Building code standard identifiers
 */
export type BuildingCodeStandard = 'ASHRAE_90_1' | 'IECC_2021' | 'IECC_2018' | 'ISO_6946' | 'EN_12831' | 'BC_BC_2018' | 'NBC_Canada_2020' | 'EU_2018_844';

/**
 * Climate zone identifiers
 * Climate zones 1-8 based on heating degree days
 */
export type ClimateZone = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Building component categories
 */
export type BuildingComponentType = 'opaque_walls' | 'floors' | 'roof' | 'windows' | 'doors';

/**
 * U-value requirement for a specific building code, climate zone, and component
 */
export interface UValueRequirement {
  /** Maximum allowed U-value in W/m²K */
  maxValue: number;
  /** Building code standard */
  code: BuildingCodeStandard;
  /** Climate zone */
  zone: ClimateZone;
  /** Component type */
  componentType: BuildingComponentType;
  /** Requirement notes/exceptions */
  notes?: string;
}

/**
 * Building code metadata
 */
export interface BuildingCodeInfo {
  /** Standard identifier */
  code: BuildingCodeStandard;
  /** Display name */
  name: string;
  /** Version/year */
  version: string;
  /** Description */
  description: string;
  /** Official documentation URL */
  documentationUrl: string;
  /** Regions where this code applies */
  regions: string[];
}

/**
 * ASHRAE 90.1 U-value requirements (W/m²K)
 * Based on ASHRAE 90.1-2019
 */
const ASHRAE_90_1_REQUIREMENTS: Record<ClimateZone, Partial<Record<BuildingComponentType, number>>> = {
  1: { opaque_walls: 0.90, floors: 0.35, roof: 0.20, windows: 3.24, doors: 2.27 },
  2: { opaque_walls: 0.90, floors: 0.35, roof: 0.18, windows: 2.72, doors: 2.27 },
  3: { opaque_walls: 0.66, floors: 0.32, roof: 0.15, windows: 2.27, doors: 2.00 },
  4: { opaque_walls: 0.53, floors: 0.29, roof: 0.12, windows: 1.87, doors: 1.76 },
  5: { opaque_walls: 0.42, floors: 0.25, roof: 0.10, windows: 1.51, doors: 1.76 },
  6: { opaque_walls: 0.36, floors: 0.25, roof: 0.10, windows: 1.36, doors: 1.76 },
  7: { opaque_walls: 0.36, floors: 0.25, roof: 0.09, windows: 1.22, doors: 1.76 },
  8: { opaque_walls: 0.36, floors: 0.25, roof: 0.09, windows: 1.22, doors: 1.76 }
};

/**
 * IECC 2021 U-value requirements (W/m²K)
 * Based on International Energy Conservation Code 2021
 */
const IECC_2021_REQUIREMENTS: Record<ClimateZone, Partial<Record<BuildingComponentType, number>>> = {
  1: { opaque_walls: 0.86, floors: 0.32, roof: 0.15, windows: 3.23, doors: 1.82 },
  2: { opaque_walls: 0.86, floors: 0.32, roof: 0.15, windows: 2.61, doors: 1.82 },
  3: { opaque_walls: 0.68, floors: 0.28, roof: 0.12, windows: 2.27, doors: 1.82 },
  4: { opaque_walls: 0.68, floors: 0.25, roof: 0.12, windows: 1.82, doors: 1.82 },
  5: { opaque_walls: 0.51, floors: 0.23, roof: 0.09, windows: 1.59, doors: 1.82 },
  6: { opaque_walls: 0.45, floors: 0.23, roof: 0.09, windows: 1.36, doors: 1.82 },
  7: { opaque_walls: 0.45, floors: 0.23, roof: 0.09, windows: 1.36, doors: 1.82 },
  8: { opaque_walls: 0.45, floors: 0.23, roof: 0.09, windows: 1.36, doors: 1.82 }
};

/**
 * ISO 6946 U-value requirements (W/m²K)
 * Based on ISO 6946:2017 (International standard)
 */
const ISO_6946_REQUIREMENTS: Record<ClimateZone, Partial<Record<BuildingComponentType, number>>> = {
  1: { opaque_walls: 0.90, floors: 0.40, roof: 0.25, windows: 3.50, doors: 2.50 },
  2: { opaque_walls: 0.80, floors: 0.35, roof: 0.22, windows: 3.00, doors: 2.30 },
  3: { opaque_walls: 0.60, floors: 0.30, roof: 0.18, windows: 2.50, doors: 2.00 },
  4: { opaque_walls: 0.50, floors: 0.25, roof: 0.15, windows: 2.00, doors: 1.80 },
  5: { opaque_walls: 0.40, floors: 0.20, roof: 0.12, windows: 1.50, doors: 1.60 },
  6: { opaque_walls: 0.35, floors: 0.20, roof: 0.10, windows: 1.30, doors: 1.50 },
  7: { opaque_walls: 0.35, floors: 0.20, roof: 0.10, windows: 1.20, doors: 1.50 },
  8: { opaque_walls: 0.35, floors: 0.20, roof: 0.10, windows: 1.20, doors: 1.50 }
};

/**
 * EN 12831 U-value requirements (W/m²K)
 * Based on EN 12831-1:2017 (European standard)
 */
const EN_12831_REQUIREMENTS: Record<ClimateZone, Partial<Record<BuildingComponentType, number>>> = {
  1: { opaque_walls: 0.90, floors: 0.40, roof: 0.25, windows: 3.50, doors: 2.50 },
  2: { opaque_walls: 0.80, floors: 0.35, roof: 0.22, windows: 3.00, doors: 2.30 },
  3: { opaque_walls: 0.60, floors: 0.30, roof: 0.18, windows: 2.50, doors: 2.00 },
  4: { opaque_walls: 0.50, floors: 0.25, roof: 0.15, windows: 2.00, doors: 1.80 },
  5: { opaque_walls: 0.40, floors: 0.20, roof: 0.12, windows: 1.50, doors: 1.60 },
  6: { opaque_walls: 0.35, floors: 0.20, roof: 0.10, windows: 1.30, doors: 1.50 },
  7: { opaque_walls: 0.35, floors: 0.20, roof: 0.10, windows: 1.20, doors: 1.50 },
  8: { opaque_walls: 0.35, floors: 0.20, roof: 0.10, windows: 1.20, doors: 1.50 }
};

/**
 * Building code metadata database
 */
export const BUILDING_CODES: Record<BuildingCodeStandard, BuildingCodeInfo> = {
  ASHRAE_90_1: {
    code: 'ASHRAE_90_1',
    name: 'ASHRAE 90.1',
    version: '2019',
    description: 'Energy Standard for Buildings Except Low-Rise Residential Buildings',
    documentationUrl: 'https://www.ashrae.org/technical-resources/standards-and-guidelines',
    regions: ['United States', 'Canada', 'Mexico', 'Various international']
  },
  IECC_2021: {
    code: 'IECC_2021',
    name: 'IECC 2021',
    version: '2021',
    description: 'International Energy Conservation Code',
    documentationUrl: 'https://codes.iccsafe.org/content/IECC2021',
    regions: ['United States (varies by state)', 'Puerto Rico', 'US Virgin Islands']
  },
  IECC_2018: {
    code: 'IECC_2018',
    name: 'IECC 2018',
    version: '2018',
    description: 'International Energy Conservation Code 2018',
    documentationUrl: 'https://codes.iccsafe.org/content/IECC2018',
    regions: ['United States (varies by state)']
  },
  ISO_6946: {
    code: 'ISO_6946',
    name: 'ISO 6946',
    version: '2017',
    description: 'Thermal insulation - Building elements - Calculation of thermal transmittance',
    documentationUrl: 'https://www.iso.org/standard/63594.html',
    regions: ['International', 'European Union', 'Various countries']
  },
  EN_12831: {
    code: 'EN_12831',
    name: 'EN 12831',
    version: '2017',
    description: 'Heating systems in buildings - Method for calculation of the design heat load',
    documentationUrl: 'https://standards.cen.eu/dyn/www/f?p=204:7:0::::FSP_PROJECT,FSP_ORG_ID:52656,4715&cs=14DE265F39D5A5165C4021E046849B7C1',
    regions: ['European Union', 'European Economic Area']
  },
  BC_BC_2018: {
    code: 'BC_BC_2018',
    name: 'BC Building Code 2018',
    version: '2018',
    description: 'British Columbia Building Code',
    documentationUrl: 'https://www.bccodes.ca/building-code.html',
    regions: ['British Columbia, Canada']
  },
  NBC_Canada_2020: {
    code: 'NBC_Canada_2020',
    name: 'NBC Canada 2020',
    version: '2020',
    description: 'National Building Code of Canada',
    documentationUrl: 'https://nrc.canada.ca/codes-canada',
    regions: ['Canada']
  },
  EU_2018_844: {
    code: 'EU_2018_844',
    name: 'EU 2018/844',
    version: '2018',
    description: 'EU Energy Performance of Buildings Directive',
    documentationUrl: 'https://energy.ec.europa.eu/topics/energy-efficiency/energy-performance-buildings_en',
    regions: ['European Union']
  }
};

/**
 * Get U-value requirement for a specific code, zone, and component
 *
 * @param code - Building code standard
 * @param zone - Climate zone
 * @param componentType - Type of building component
 * @returns Maximum allowed U-value or null if not found
 */
export function getUValueRequirement(
  code: BuildingCodeStandard,
  zone: ClimateZone,
  componentType: BuildingComponentType
): number | null {
  let requirements: Record<ClimateZone, Partial<Record<BuildingComponentType, number>>>;

  switch (code) {
    case 'ASHRAE_90_1':
      requirements = ASHRAE_90_1_REQUIREMENTS;
      break;
    case 'IECC_2021':
      requirements = IECC_2021_REQUIREMENTS;
      break;
    case 'ISO_6946':
      requirements = ISO_6946_REQUIREMENTS;
      break;
    case 'EN_12831':
      requirements = EN_12831_REQUIREMENTS;
      break;
    default:
      return null;
  }

  return requirements[zone]?.[componentType] ?? null;
}

/**
 * Get all U-value requirements for a specific building code and climate zone
 *
 * @param code - Building code standard
 * @param zone - Climate zone
 * @returns Array of U-value requirements
 */
export function getAllUValueRequirements(
  code: BuildingCodeStandard,
  zone: ClimateZone
): UValueRequirement[] {
  const requirements: UValueRequirement[] = [];
  const componentTypes: BuildingComponentType[] = ['opaque_walls', 'floors', 'roof', 'windows', 'doors'];

  componentTypes.forEach(componentType => {
    const maxValue = getUValueRequirement(code, zone, componentType);
    if (maxValue !== null) {
      requirements.push({
        maxValue,
        code,
        zone,
        componentType
      });
    }
  });

  return requirements;
}

/**
 * Get building code information
 *
 * @param code - Building code standard
 * @returns Building code metadata
 */
export function getBuildingCodeInfo(code: BuildingCodeStandard): BuildingCodeInfo {
  return BUILDING_CODES[code];
}

/**
 * Get all available building codes
 *
 * @returns Array of building code information
 */
export function getAllBuildingCodes(): BuildingCodeInfo[] {
  return Object.values(BUILDING_CODES);
}

/**
 * Climate zone descriptions
 */
export const CLIMATE_ZONE_DESCRIPTIONS: Record<ClimateZone, string> = {
  1: 'Very Hot - Humid (HDD < 2000)',
  2: 'Hot - Humid (HDD 2000-3000)',
  3: 'Mixed - Humid (HDD 3000-4000)',
  4: 'Mixed - Humid/Hot-Dry (HDD 4000-5000)',
  5: 'Cool (HDD 5000-6000)',
  6: 'Cold (HDD 6000-7000)',
  7: 'Very Cold (HDD 7000-8000)',
  8: 'Subarctic/Arctic (HDD > 8000)'
};

/**
 * Get climate zone description
 *
 * @param zone - Climate zone
 * @returns Climate zone description
 */
export function getClimateZoneDescription(zone: ClimateZone): string {
  return CLIMATE_ZONE_DESCRIPTIONS[zone];
}

/**
 * Default building code and climate zone for new calculations
 */
export const DEFAULT_BUILDING_CODE: BuildingCodeStandard = 'ASHRAE_90_1';
export const DEFAULT_CLIMATE_ZONE: ClimateZone = 4;
export const DEFAULT_COMPONENT_TYPE: BuildingComponentType = 'opaque_walls';

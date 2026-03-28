/**
 * Material database with thermal properties
 *
 * This is the single source of truth for material data used in calculations.
 * All material lookups should reference these constants.
 */

import { Material } from '../types/domain';

/**
 * Complete material library
 *
 * Includes common construction materials with their thermal properties,
 * costs, and vapor resistance values.
 */
export const MATERIALS: Material[] = [
  // Structural Materials
  { name: "Brick", conductivity: 1.7, color: "#BC4A3C", cost: 0.55, isInsulation: false, vaporResistance: 10 },
  { name: "Concrete", conductivity: 1.7, color: "#C4B6A6", cost: 150.0, isInsulation: false, vaporResistance: 100 },
  { name: "Glass", conductivity: 1.0, color: "#E0FFFF", cost: 10.0, isInsulation: false, vaporResistance: 1 },
  { name: "Steel", conductivity: 50.0, color: "#B0C4DE", cost: 500.0, isInsulation: false, vaporResistance: 1 },
  { name: "Aluminum", conductivity: 200.0, color: "#D3D3D3", cost: 600.0, isInsulation: false, vaporResistance: 1 },

  // Sheathing & Panels
  { name: "Gypsum Board", conductivity: 0.2, color: "#EEEDE4", cost: 2.5, isInsulation: false, vaporResistance: 8 },
  { name: "Plywood", conductivity: 0.3, color: "#EED5AE", cost: 35.55, isInsulation: false, vaporResistance: 200 },
  { name: "OSB", conductivity: 0.13, color: "#DAA520", cost: 36.14, isInsulation: false, vaporResistance: 150 },
  { name: "Plaster", conductivity: 0.5, color: "#f8f8ff", cost: 5.0, isInsulation: false, vaporResistance: 10 },

  // Insulation Materials
  { name: "Mineral Wool λ0.036", conductivity: 0.036, color: "#D3D3D3", cost: 0.5, isInsulation: true, vaporResistance: 1 },
  { name: "Mineral Wool λ0.034", conductivity: 0.034, color: "#D3D3F3", cost: 1.0, isInsulation: true, vaporResistance: 1 },
  { name: "Insulation Foam", conductivity: 0.039, color: "#d0eae8", cost: 2.25, isInsulation: true, vaporResistance: 50 },
  { name: "Cellulose Insulation", conductivity: 0.04, color: "#F5DEB3", cost: 0.5, isInsulation: true, vaporResistance: 1 },
  { name: "Fiberglass", conductivity: 0.035, color: "#FFFFE0", cost: 0.6, isInsulation: true, vaporResistance: 1 },
  { name: "XPS Foam", conductivity: 0.03, color: "#87CEFA", cost: 2.0, isInsulation: true, vaporResistance: 100 },
  { name: "EPS Foam", conductivity: 0.03, color: "#B0E0E6", cost: 1.5, isInsulation: true, vaporResistance: 50 },

  // Air Spaces & Cavities
  { name: "Service Space", conductivity: 0.036, color: "#E8E8E8", cost: 0.5, isInsulation: true, vaporResistance: 1 },

  // Barriers & Membranes
  { name: "Windbreak", conductivity: 0.2, color: "#87CEEB", cost: 5.0, isInsulation: false, vaporResistance: 100 },
  { name: "Vapour Barrier", conductivity: 0.4, color: "#87CEEB", cost: 3.0, isInsulation: false, vaporResistance: 100000 },
  { name: "Vinyl", conductivity: 0.15, color: "#F0FFF0", cost: 5.0, isInsulation: false, vaporResistance: 1000 },
];

/**
 * Material lookup by name
 *
 * @param name - Material name to look up
 * @returns Material if found, undefined otherwise
 */
export function getMaterialByName(name: string): Material | undefined {
  return MATERIALS.find(m => m.name === name);
}

/**
 * Get all insulation materials
 *
 * @returns Array of insulation materials sorted by conductivity
 */
export function getInsulationMaterials(): Material[] {
  return MATERIALS.filter(m => m.isInsulation).sort((a, b) => a.conductivity - b.conductivity);
}

/**
 * Get all non-insulation structural materials
 *
 * @returns Array of structural materials
 */
export function getStructuralMaterials(): Material[] {
  return MATERIALS.filter(m => !m.isInsulation);
}

/**
 * Check if a material provides insulation
 *
 * @param name - Material name
 * @returns True if material is insulation
 */
export function isInsulationMaterial(name: string): boolean {
  const material = getMaterialByName(name);
  return material?.isInsulation ?? false;
}

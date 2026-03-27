/**
 * Material Helper Utilities
 *
 * Utility functions for working with materials,
 * including color mapping, validation, and lookup operations.
 */

import { Material } from '../types/domain';
import { MATERIALS, getMaterialByName } from '../constants/materials';

/**
 * Get color code for a material by name
 *
 * This is the single source of truth for material colors
 * used throughout the application.
 *
 * @param materialName - Name of the material
 * @returns Color hex code, or gray if material not found
 *
 * @example
 * const color = getMaterialColor('Brick');
 * // Returns '#BC4A3C'
 */
export function getMaterialColor(materialName: string): string {
  const material = getMaterialByName(materialName);
  return material?.color || '#D3D3D3';
}

/**
 * Check if a color is light (for text contrast)
 *
 * @param hexColor - Color in hex format
 * @returns True if color is light (luminance > 128)
 */
export function isLightColor(hexColor: string): boolean {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return true;

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
  return luminance > 128;
}

/**
 * Convert hex color to RGB
 *
 * @param hex - Color in hex format (#RRGGBB or #RGB)
 * @returns RGB object or null if invalid
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * Get contrasting text color for a background
 *
 * @param backgroundColor - Background color in hex
 * @returns 'white' or 'black' based on luminance
 */
export function getContrastTextColor(backgroundColor: string): 'white' | 'black' {
  return isLightColor(backgroundColor) ? 'black' : 'white';
}

/**
 * Validate wall component data
 *
 * @param component - Wall component to validate
 * @returns Validation result with errors if any
 */
export function validateWallComponent(component: {
  material: string;
  thickness: number;
  conductivity: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if material exists
  if (!getMaterialByName(component.material)) {
    errors.push(`Material "${component.material}" not found in database`);
  }

  // Check thickness
  if (component.thickness <= 0) {
    errors.push('Thickness must be greater than 0');
  }
  if (component.thickness > 1000) {
    errors.push('Thickness cannot exceed 1000mm');
  }

  // Check conductivity
  if (component.conductivity <= 0) {
    errors.push('Conductivity must be greater than 0');
  }
  if (component.conductivity > 500) {
    errors.push('Conductivity cannot exceed 500 W/mK');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Search materials by name (fuzzy match)
 *
 * @param query - Search query
 * @returns Array of matching materials
 */
export function searchMaterials(query: string): Material[] {
  const lowerQuery = query.toLowerCase();
  return MATERIALS.filter(material =>
    material.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Group materials by type
 *
 * @returns Object with insulation and structural material arrays
 */
export function groupMaterialsByType(): {
  insulation: Material[];
  structural: Material[];
} {
  return {
    insulation: MATERIALS.filter(m => m.isInsulation),
    structural: MATERIALS.filter(m => !m.isInsulation)
  };
}

/**
 * Sort materials by conductivity
 *
 * @param materials - Materials to sort
 * @param ascending - Sort order (default true)
 * @returns Sorted materials
 */
export function sortMaterialsByConductivity(
  materials: Material[],
  ascending: boolean = true
): Material[] {
  return [...materials].sort((a, b) =>
    ascending ? a.conductivity - b.conductivity : b.conductivity - a.conductivity
  );
}

/**
 * Sort materials by cost effectiveness
 *
 * @param materials - Materials to sort
 * @param ascending - Sort order (default true, higher R-value per $ first)
 * @returns Sorted materials
 */
export function sortMaterialsByCostEffectiveness(
  materials: Material[],
  ascending: boolean = true
): Material[] {
  const materialsWithEffectiveness = materials.map(m => ({
    ...m,
    effectiveness: m.conductivity > 0 ? (1 / m.conductivity) / m.cost : 0
  }));

  return materialsWithEffectiveness.sort((a, b) =>
    ascending ? b.effectiveness - a.effectiveness : a.effectiveness - b.effectiveness
  ).map(e => {
    const { ...material } = e;
    return material;
  });
}

/**
 * Format thickness for display
 *
 * @param thickness - Thickness in millimeters
 * @returns Formatted string
 */
export function formatThickness(thickness: number): string {
  if (thickness >= 1000) {
    return `${(thickness / 1000).toFixed(2)}m`;
  }
  return `${thickness}mm`;
}

/**
 * Format conductivity for display
 *
 * @param conductivity - Thermal conductivity in W/mK
 * @returns Formatted string
 */
export function formatConductivity(conductivity: number): string {
  return `${conductivity.toFixed(3)} W/mK`;
}

/**
 * Format cost for display
 *
 * @param cost - Cost in currency per m²
 * @returns Formatted string
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}/m²`;
}

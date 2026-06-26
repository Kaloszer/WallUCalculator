/**
 * Material Storage Utilities
 *
 * CRUD operations for materials using localStorage.
 * Supports material creation, reading, updating, deleting, and querying.
 */

import {
  MaterialExtended,
  MaterialFilter,
  MaterialQueryResult,
  Material
} from '../types/domain';

const MATERIALS_STORAGE_KEY = 'wallu_materials';
const CUSTOM_MATERIALS_PREFIX = 'custom_';

/**
 * Generate a unique ID for a material
 *
 * @returns Unique identifier string
 */
function generateMaterialId(): string {
  return `${CUSTOM_MATERIALS_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all materials from storage
 *
 * Combines default materials from constants with custom materials from localStorage.
 *
 * @returns Array of all materials
 */
export function getAllMaterials(): MaterialExtended[] {
  try {
    const stored = localStorage.getItem(MATERIALS_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as MaterialExtended[];
  } catch (error) {
    console.error('Error reading materials from storage:', error);
    return [];
  }
}

/**
 * Save materials to storage
 *
 * @param materials - Array of materials to save
 * @returns True if successful, false otherwise
 */
function saveMaterials(materials: MaterialExtended[]): boolean {
  try {
    localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(materials));
    return true;
  } catch (error) {
    console.error('Error saving materials to storage:', error);
    return false;
  }
}

/**
 * Create a new custom material
 *
 * @param material - Material data (without id, timestamps)
 * @returns Created material with generated ID, or null if failed
 */
export function createMaterial(
  material: Omit<MaterialExtended, 'id' | 'createdAt' | 'updatedAt'>
): MaterialExtended | null {
  try {
    const materials = getAllMaterials();
    const now = new Date().toISOString();

    const newMaterial: MaterialExtended = {
      ...material,
      id: generateMaterialId(),
      source: material.source || 'user',
      createdAt: now,
      updatedAt: now
    };

    materials.push(newMaterial);

    if (saveMaterials(materials)) {
      return newMaterial;
    }
    return null;
  } catch (error) {
    console.error('Error creating material:', error);
    return null;
  }
}

/**
 * Get a material by ID
 *
 * @param id - Material ID to retrieve
 * @returns Material if found, undefined otherwise
 */
export function getMaterialById(id: string): MaterialExtended | undefined {
  try {
    const materials = getAllMaterials();
    return materials.find(m => m.id === id);
  } catch (error) {
    console.error('Error getting material by ID:', error);
    return undefined;
  }
}

/**
 * Update an existing material
 *
 * @param id - ID of material to update
 * @param updates - Partial material data to update
 * @returns Updated material if successful, null otherwise
 */
export function updateMaterial(
  id: string,
  updates: Partial<Omit<MaterialExtended, 'id' | 'createdAt'>>
): MaterialExtended | null {
  try {
    const materials = getAllMaterials();
    const index = materials.findIndex(m => m.id === id);

    if (index === -1) {
      console.warn(`Material with ID ${id} not found`);
      return null;
    }

    materials[index] = {
      ...materials[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (saveMaterials(materials)) {
      return materials[index];
    }
    return null;
  } catch (error) {
    console.error('Error updating material:', error);
    return null;
  }
}

/**
 * Delete a material
 *
 * @param id - ID of material to delete
 * @returns True if deleted, false if not found or failed
 */
export function deleteMaterial(id: string): boolean {
  try {
    const materials = getAllMaterials();
    const filtered = materials.filter(m => m.id !== id);

    if (filtered.length === materials.length) {
      // Material not found
      return false;
    }

    return saveMaterials(filtered);
  } catch (error) {
    console.error('Error deleting material:', error);
    return false;
  }
}

/**
 * Query materials with filtering and pagination
 *
 * @param filter - Filter criteria
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of results per page
 * @returns Query result with materials and metadata
 */
export function queryMaterials(
  filter: MaterialFilter = {},
  page: number = 1,
  pageSize: number = 20
): MaterialQueryResult {
  try {
    let materials = getAllMaterials();

    // Apply filters
    if (filter.query) {
      const query = filter.query.toLowerCase();
      materials = materials.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.manufacturer?.toLowerCase().includes(query) ||
        m.productCode?.toLowerCase().includes(query) ||
        m.notes?.toLowerCase().includes(query)
      );
    }

    if (filter.category) {
      materials = materials.filter(m => m.category === filter.category);
    }

    if (filter.isInsulation !== undefined) {
      materials = materials.filter(m => m.isInsulation === filter.isInsulation);
    }

    if (filter.source) {
      materials = materials.filter(m => m.source === filter.source);
    }

    if (filter.minConductivity !== undefined) {
      materials = materials.filter(m => m.conductivity >= filter.minConductivity!);
    }

    if (filter.maxConductivity !== undefined) {
      materials = materials.filter(m => m.conductivity <= filter.maxConductivity!);
    }

    if (filter.minCost !== undefined) {
      materials = materials.filter(m => m.cost >= filter.minCost!);
    }

    if (filter.maxCost !== undefined) {
      materials = materials.filter(m => m.cost <= filter.maxCost!);
    }

    if (filter.manufacturer) {
      const manufacturerFilter = filter.manufacturer;
      materials = materials.filter(m =>
        m.manufacturer?.toLowerCase() === manufacturerFilter.toLowerCase()
      );
    }

    const total = materials.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedMaterials = materials.slice(startIndex, endIndex);

    return {
      materials: paginatedMaterials,
      total,
      page,
      pageSize
    };
  } catch (error) {
    console.error('Error querying materials:', error);
    return {
      materials: [],
      total: 0,
      page,
      pageSize
    };
  }
}

/**
 * Search materials by name (fuzzy match)
 *
 * @param query - Search query
 * @param limit - Maximum number of results
 * @returns Array of matching materials
 */
export function searchMaterials(query: string, limit: number = 10): MaterialExtended[] {
  const result = queryMaterials({ query }, 1, limit);
  return result.materials;
}

/**
 * Get all custom materials (user-defined)
 *
 * @returns Array of custom materials
 */
export function getCustomMaterials(): MaterialExtended[] {
  try {
    const materials = getAllMaterials();
    return materials.filter(m => m.source === 'user' || m.source === 'manufacturer');
  } catch (error) {
    console.error('Error getting custom materials:', error);
    return [];
  }
}

/**
 * Get materials by category
 *
 * @param category - Category name
 * @returns Array of materials in category
 */
export function getMaterialsByCategory(category: string): MaterialExtended[] {
  try {
    const materials = getAllMaterials();
    return materials.filter(m => m.category === category);
  } catch (error) {
    console.error('Error getting materials by category:', error);
    return [];
  }
}

/**
 * Get all unique categories
 *
 * @returns Array of unique category names
 */
export function getMaterialCategories(): string[] {
  try {
    const materials = getAllMaterials();
    const categories = new Set(materials.map(m => m.category));
    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error getting material categories:', error);
    return [];
  }
}

/**
 * Check if a material name already exists
 *
 * @param name - Material name to check
 * @param excludeId - ID to exclude from check (for updates)
 * @returns True if name exists, false otherwise
 */
export function materialNameExists(name: string, excludeId?: string): boolean {
  try {
    const materials = getAllMaterials();
    return materials.some(m =>
      m.name.toLowerCase() === name.toLowerCase() && m.id !== excludeId
    );
  } catch (error) {
    console.error('Error checking material name:', error);
    return false;
  }
}

/**
 * Import materials from array
 *
 * Useful for bulk import operations.
 *
 * @param materials - Array of materials to import
 * @param overwrite - Whether to overwrite existing materials with same name
 * @returns Number of materials imported
 */
export function importMaterials(
  materials: Omit<MaterialExtended, 'id' | 'createdAt' | 'updatedAt'>[],
  overwrite: boolean = false
): number {
  try {
    const existingMaterials = getAllMaterials();
    const now = new Date().toISOString();
    let importedCount = 0;

    for (const material of materials) {
      const existingIndex = existingMaterials.findIndex(
        m => m.name.toLowerCase() === material.name.toLowerCase()
      );

      const newMaterial: MaterialExtended = {
        ...material,
        id: generateMaterialId(),
        createdAt: now,
        updatedAt: now
      };

      if (existingIndex >= 0) {
        if (overwrite) {
          newMaterial.id = existingMaterials[existingIndex].id;
          newMaterial.createdAt = existingMaterials[existingIndex].createdAt;
          existingMaterials[existingIndex] = newMaterial;
          importedCount++;
        }
      } else {
        existingMaterials.push(newMaterial);
        importedCount++;
      }
    }

    if (saveMaterials(existingMaterials)) {
      return importedCount;
    }
    return 0;
  } catch (error) {
    console.error('Error importing materials:', error);
    return 0;
  }
}

/**
 * Export all custom materials
 *
 * @returns Array of custom materials
 */
export function exportCustomMaterials(): MaterialExtended[] {
  return getCustomMaterials();
}

/**
 * Clear all custom materials from storage
 *
 * @returns True if successful, false otherwise
 */
export function clearCustomMaterials(): boolean {
  try {
    const materials = getAllMaterials();
    const databaseMaterials = materials.filter(m => m.source === 'database');
    return saveMaterials(databaseMaterials);
  } catch (error) {
    console.error('Error clearing custom materials:', error);
    return false;
  }
}

/**
 * Validate material data
 *
 * @param material - Material to validate
 * @returns Validation result with errors if any
 */
export function validateMaterial(
  material: Partial<MaterialExtended>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!material.name || material.name.trim().length === 0) {
    errors.push('Material name is required');
  }

  if (typeof material.conductivity !== 'number' || material.conductivity <= 0) {
    errors.push('Conductivity must be a positive number');
  }

  if (typeof material.conductivity === 'number' && material.conductivity > 500) {
    errors.push('Conductivity cannot exceed 500 W/mK');
  }

  if (typeof material.cost !== 'number' || material.cost < 0) {
    errors.push('Cost must be a non-negative number');
  }

  if (typeof material.isInsulation !== 'boolean') {
    errors.push('isInsulation must be a boolean');
  }

  if (typeof material.vaporResistance !== 'number' || material.vaporResistance <= 0) {
    errors.push('Vapor resistance must be a positive number');
  }

  if (!material.color || !/^#[0-9A-Fa-f]{6}$/.test(material.color)) {
    errors.push('Color must be a valid hex color code (#RRGGBB)');
  }

  if (!material.category || material.category.trim().length === 0) {
    errors.push('Category is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

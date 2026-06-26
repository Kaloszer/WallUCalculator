/**
 * Wall Assembly Storage Utilities
 *
 * Save and load wall assembly configurations with localStorage.
 * Supports CRUD operations for wall assemblies with metadata.
 */

import {
  SavedWallAssembly,
  WallComponent,
  StudWallConfig,
  ThermalPerformance
} from '../types/domain';

const ASSEMBLIES_STORAGE_KEY = 'wallu_assemblies';
const ASSEMBLY_PREFIX = 'assembly_';

/**
 * Generate a unique ID for an assembly
 *
 * @returns Unique identifier string
 */
function generateAssemblyId(): string {
  return `${ASSEMBLY_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all saved assemblies
 *
 * @returns Array of saved assemblies
 */
export function getAllAssemblies(): SavedWallAssembly[] {
  try {
    const stored = localStorage.getItem(ASSEMBLIES_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as SavedWallAssembly[];
  } catch (error) {
    console.error('Error reading assemblies from storage:', error);
    return [];
  }
}

/**
 * Save assemblies to storage
 *
 * @param assemblies - Array of assemblies to save
 * @returns True if successful, false otherwise
 */
function saveAssemblies(assemblies: SavedWallAssembly[]): boolean {
  try {
    localStorage.setItem(ASSEMBLIES_STORAGE_KEY, JSON.stringify(assemblies));
    return true;
  } catch (error) {
    console.error('Error saving assemblies to storage:', error);
    return false;
  }
}

/**
 * Save a new wall assembly
 *
 * @param name - Assembly name
 * @param components - Wall components
 * @param studWallConfig - Optional stud wall configuration
 * @param performance - Calculated performance metrics
 * @param options - Additional options (description, tags, notes)
 * @returns Saved assembly with generated ID, or null if failed
 */
export function saveAssembly(
  name: string,
  components: WallComponent[],
  studWallConfig: StudWallConfig | undefined,
  performance: ThermalPerformance,
  options?: {
    description?: string;
    tags?: string[];
    notes?: string;
    isTemplate?: boolean;
  }
): SavedWallAssembly | null {
  try {
    const assemblies = getAllAssemblies();
    const now = new Date().toISOString();

    // Ensure components have IDs
    const componentsWithIds = components.map((comp, index) => ({
      ...comp,
      id: comp.id || index
    }));

    const newAssembly: SavedWallAssembly = {
      id: generateAssemblyId(),
      name,
      description: options?.description,
      components: componentsWithIds,
      studWallConfig,
      performance,
      createdAt: now,
      updatedAt: now,
      tags: options?.tags || [],
      isTemplate: options?.isTemplate || false,
      notes: options?.notes
    };

    assemblies.push(newAssembly);

    if (saveAssemblies(assemblies)) {
      return newAssembly;
    }
    return null;
  } catch (error) {
    console.error('Error saving assembly:', error);
    return null;
  }
}

/**
 * Get an assembly by ID
 *
 * @param id - Assembly ID to retrieve
 * @returns Assembly if found, undefined otherwise
 */
export function getAssemblyById(id: string): SavedWallAssembly | undefined {
  try {
    const assemblies = getAllAssemblies();
    return assemblies.find(a => a.id === id);
  } catch (error) {
    console.error('Error getting assembly by ID:', error);
    return undefined;
  }
}

/**
 * Update an existing assembly
 *
 * @param id - ID of assembly to update
 * @param updates - Partial assembly data to update
 * @returns Updated assembly if successful, null otherwise
 */
export function updateAssembly(
  id: string,
  updates: Partial<Omit<SavedWallAssembly, 'id' | 'createdAt'>>
): SavedWallAssembly | null {
  try {
    const assemblies = getAllAssemblies();
    const index = assemblies.findIndex(a => a.id === id);

    if (index === -1) {
      console.warn(`Assembly with ID ${id} not found`);
      return null;
    }

    // Ensure components have IDs if provided
    let components = updates.components;
    if (components) {
      components = components.map((comp, idx) => ({
        ...comp,
        id: comp.id !== undefined ? comp.id : idx
      }));
    }

    assemblies[index] = {
      ...assemblies[index],
      ...updates,
      components: components || assemblies[index].components,
      updatedAt: new Date().toISOString()
    };

    if (saveAssemblies(assemblies)) {
      return assemblies[index];
    }
    return null;
  } catch (error) {
    console.error('Error updating assembly:', error);
    return null;
  }
}

/**
 * Delete an assembly
 *
 * @param id - ID of assembly to delete
 * @returns True if deleted, false if not found or failed
 */
export function deleteAssembly(id: string): boolean {
  try {
    const assemblies = getAllAssemblies();
    const filtered = assemblies.filter(a => a.id !== id);

    if (filtered.length === assemblies.length) {
      // Assembly not found
      return false;
    }

    return saveAssemblies(filtered);
  } catch (error) {
    console.error('Error deleting assembly:', error);
    return false;
  }
}

/**
 * Duplicate an assembly
 *
 * Creates a copy of an assembly with a new ID and name.
 *
 * @param id - ID of assembly to duplicate
 * @param newName - Optional new name (defaults to "Copy of [original name]")
 * @returns Duplicated assembly if successful, null otherwise
 */
export function duplicateAssembly(id: string, newName?: string): SavedWallAssembly | null {
  try {
    const original = getAssemblyById(id);
    if (!original) {
      console.warn(`Assembly with ID ${id} not found`);
      return null;
    }

    const assemblies = getAllAssemblies();
    const now = new Date().toISOString();

    const duplicated: SavedWallAssembly = {
      ...original,
      id: generateAssemblyId(),
      name: newName || `Copy of ${original.name}`,
      createdAt: now,
      updatedAt: now,
      isTemplate: false // Duplicate is not a template
    };

    assemblies.push(duplicated);

    if (saveAssemblies(assemblies)) {
      return duplicated;
    }
    return null;
  } catch (error) {
    console.error('Error duplicating assembly:', error);
    return null;
  }
}

/**
 * Get template assemblies
 *
 * @returns Array of template assemblies
 */
export function getTemplateAssemblies(): SavedWallAssembly[] {
  try {
    const assemblies = getAllAssemblies();
    return assemblies.filter(a => a.isTemplate);
  } catch (error) {
    console.error('Error getting template assemblies:', error);
    return [];
  }
}

/**
 * Get assemblies by tag
 *
 * @param tag - Tag to filter by
 * @returns Array of assemblies with the tag
 */
export function getAssembliesByTag(tag: string): SavedWallAssembly[] {
  try {
    const assemblies = getAllAssemblies();
    return assemblies.filter(a => a.tags.includes(tag));
  } catch (error) {
    console.error('Error getting assemblies by tag:', error);
    return [];
  }
}

/**
 * Get all unique tags from assemblies
 *
 * @returns Array of unique tag names
 */
export function getAllTags(): string[] {
  try {
    const assemblies = getAllAssemblies();
    const tags = new Set<string>();
    assemblies.forEach(a => a.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  } catch (error) {
    console.error('Error getting tags:', error);
    return [];
  }
}

/**
 * Search assemblies by name or description
 *
 * @param query - Search query
 * @returns Array of matching assemblies
 */
export function searchAssemblies(query: string): SavedWallAssembly[] {
  try {
    const assemblies = getAllAssemblies();
    const lowerQuery = query.toLowerCase();
    return assemblies.filter(a =>
      a.name.toLowerCase().includes(lowerQuery) ||
      a.description?.toLowerCase().includes(lowerQuery) ||
      a.notes?.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Error searching assemblies:', error);
    return [];
  }
}

/**
 * Sort assemblies by U-value
 *
 * @param ascending - Sort order (lower U-values first if true)
 * @returns Sorted array of assemblies
 */
export function sortAssembliesByUValue(ascending: boolean = true): SavedWallAssembly[] {
  try {
    const assemblies = getAllAssemblies();
    return [...assemblies].sort((a, b) =>
      ascending
        ? a.performance.uValue - b.performance.uValue
        : b.performance.uValue - a.performance.uValue
    );
  } catch (error) {
    console.error('Error sorting assemblies by U-value:', error);
    return [];
  }
}

/**
 * Sort assemblies by cost
 *
 * @param ascending - Sort order (lower costs first if true)
 * @returns Sorted array of assemblies
 */
export function sortAssembliesByCost(ascending: boolean = true): SavedWallAssembly[] {
  try {
    const assemblies = getAllAssemblies();
    return [...assemblies].sort((a, b) =>
      ascending
        ? a.performance.totalCost - b.performance.totalCost
        : b.performance.totalCost - a.performance.totalCost
    );
  } catch (error) {
    console.error('Error sorting assemblies by cost:', error);
    return [];
  }
}

/**
 * Sort assemblies by date (created or updated)
 *
 * @param byUpdated - Sort by updated date if true, created date if false
 * @param ascending - Sort order (newest first if false)
 * @returns Sorted array of assemblies
 */
export function sortAssembliesByDate(
  byUpdated: boolean = true,
  ascending: boolean = false
): SavedWallAssembly[] {
  try {
    const assemblies = getAllAssemblies();
    const dateField = byUpdated ? 'updatedAt' : 'createdAt';
    return [...assemblies].sort((a, b) => {
      const dateA = new Date(a[dateField]).getTime();
      const dateB = new Date(b[dateField]).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  } catch (error) {
    console.error('Error sorting assemblies by date:', error);
    return [];
  }
}

/**
 * Check if an assembly name already exists
 *
 * @param name - Assembly name to check
 * @param excludeId - ID to exclude from check (for updates)
 * @returns True if name exists, false otherwise
 */
export function assemblyNameExists(name: string, excludeId?: string): boolean {
  try {
    const assemblies = getAllAssemblies();
    return assemblies.some(a =>
      a.name.toLowerCase() === name.toLowerCase() && a.id !== excludeId
    );
  } catch (error) {
    console.error('Error checking assembly name:', error);
    return false;
  }
}

/**
 * Get assemblies with U-value above threshold
 *
 * @param maxUValue - Maximum U-value threshold
 * @returns Array of assemblies exceeding threshold
 */
export function getAssembliesByUValueThreshold(maxUValue: number): SavedWallAssembly[] {
  try {
    const assemblies = getAllAssemblies();
    return assemblies.filter(a => a.performance.uValue > maxUValue);
  } catch (error) {
    console.error('Error getting assemblies by U-value threshold:', error);
    return [];
  }
}

/**
 * Get assemblies within cost range
 *
 * @param minCost - Minimum cost per m²
 * @param maxCost - Maximum cost per m²
 * @returns Array of assemblies within cost range
 */
export function getAssembliesByCostRange(
  minCost: number,
  maxCost: number
): SavedWallAssembly[] {
  try {
    const assemblies = getAllAssemblies();
    return assemblies.filter(
      a => a.performance.totalCost >= minCost && a.performance.totalCost <= maxCost
    );
  } catch (error) {
    console.error('Error getting assemblies by cost range:', error);
    return [];
  }
}

/**
 * Export assemblies to JSON
 *
 * @param ids - Optional array of assembly IDs to export (exports all if not provided)
 * @returns JSON string of exported assemblies
 */
export function exportAssembliesToJSON(ids?: string[]): string {
  try {
    const assemblies = getAllAssemblies();
    const toExport = ids
      ? assemblies.filter(a => ids.includes(a.id))
      : assemblies;
    return JSON.stringify(toExport, null, 2);
  } catch (error) {
    console.error('Error exporting assemblies to JSON:', error);
    return '[]';
  }
}

/**
 * Import assemblies from JSON
 *
 * @param json - JSON string of assemblies to import
 * @param overwrite - Whether to overwrite existing assemblies with same name
 * @returns Number of assemblies imported
 */
export function importAssembliesFromJSON(
  json: string,
  overwrite: boolean = false
): number {
  try {
    const imported = JSON.parse(json) as SavedWallAssembly[];
    const existingAssemblies = getAllAssemblies();
    let importedCount = 0;

    for (const assembly of imported) {
      const existingIndex = existingAssemblies.findIndex(
        a => a.name.toLowerCase() === assembly.name.toLowerCase()
      );

      const newAssembly: SavedWallAssembly = {
        ...assembly,
        id: generateAssemblyId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        if (overwrite) {
          newAssembly.id = existingAssemblies[existingIndex].id;
          newAssembly.createdAt = existingAssemblies[existingIndex].createdAt;
          existingAssemblies[existingIndex] = newAssembly;
          importedCount++;
        }
      } else {
        existingAssemblies.push(newAssembly);
        importedCount++;
      }
    }

    if (saveAssemblies(existingAssemblies)) {
      return importedCount;
    }
    return 0;
  } catch (error) {
    console.error('Error importing assemblies from JSON:', error);
    return 0;
  }
}

/**
 * Clear all assemblies from storage
 *
 * @returns True if successful, false otherwise
 */
export function clearAllAssemblies(): boolean {
  try {
    localStorage.removeItem(ASSEMBLIES_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing assemblies:', error);
    return false;
  }
}

/**
 * Get assembly statistics
 *
 * @returns Statistics about saved assemblies
 */
export function getAssemblyStatistics(): {
  total: number;
  templates: number;
  custom: number;
  avgUValue: number;
  avgCost: number;
} {
  try {
    const assemblies = getAllAssemblies();
    const templates = assemblies.filter(a => a.isTemplate).length;
    const custom = assemblies.length - templates;

    if (assemblies.length === 0) {
      return {
        total: 0,
        templates: 0,
        custom: 0,
        avgUValue: 0,
        avgCost: 0
      };
    }

    const totalUValue = assemblies.reduce((sum, a) => sum + a.performance.uValue, 0);
    const totalCost = assemblies.reduce((sum, a) => sum + a.performance.totalCost, 0);

    return {
      total: assemblies.length,
      templates,
      custom,
      avgUValue: totalUValue / assemblies.length,
      avgCost: totalCost / assemblies.length
    };
  } catch (error) {
    console.error('Error getting assembly statistics:', error);
    return {
      total: 0,
      templates: 0,
      custom: 0,
      avgUValue: 0,
      avgCost: 0
    };
  }
}

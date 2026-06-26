/**
 * Climate Profile Storage Utilities
 *
 * CRUD operations for climate profiles using localStorage.
 * Supports saving, loading, and managing climate profiles for locations.
 */

import type {
  Location,
  ClimateData,
  ClimateZone
} from '../types/domain';

const CLIMATE_PROFILES_STORAGE_KEY = 'wallu_climate_profiles';
const DEFAULT_PROFILE_KEY = 'wallu_default_climate_profile';
const PROFILE_PREFIX = 'climate_';

/**
 * Climate profile with metadata for storage
 */
export interface ClimateProfile {
  /** Unique identifier */
  id: string;
  /** Display name for the profile */
  name: string;
  /** Geographic location data */
  location: Location;
  /** Climate data for calculations */
  climateData: ClimateData;
  /** Whether this is the default profile */
  isDefault: boolean;
  /** When the profile was created */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
  /** User notes */
  notes?: string;
}

/**
 * Filter parameters for climate profile queries
 */
export interface ClimateProfileFilter {
  /** Search by name or city */
  query?: string;
  /** Filter by country */
  country?: string;
  /** Filter by climate zone */
  climateZone?: ClimateZone;
  /** Only default profiles */
  isDefault?: boolean;
}

/**
 * Result of climate profile query operation
 */
export interface ClimateProfileQueryResult {
  /** Array of matching profiles */
  profiles: ClimateProfile[];
  /** Total count of results */
  total: number;
  /** Current page number */
  page: number;
  /** Results per page */
  pageSize: number;
}

/**
 * Generate a unique ID for a climate profile
 *
 * @returns Unique identifier string
 */
function generateProfileId(): string {
  return `${PROFILE_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all climate profiles from storage
 *
 * @returns Array of all climate profiles
 */
export function getAllClimateProfiles(): ClimateProfile[] {
  try {
    const stored = localStorage.getItem(CLIMATE_PROFILES_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as ClimateProfile[];
  } catch (error) {
    console.error('Error reading climate profiles from storage:', error);
    return [];
  }
}

/**
 * Save climate profiles to storage
 *
 * @param profiles - Array of profiles to save
 * @returns True if successful, false otherwise
 */
function saveClimateProfiles(profiles: ClimateProfile[]): boolean {
  try {
    localStorage.setItem(CLIMATE_PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    return true;
  } catch (error) {
    console.error('Error saving climate profiles to storage:', error);
    return false;
  }
}

/**
 * Create a new climate profile
 *
 * @param name - Profile name
 * @param location - Location data
 * @param climateData - Climate data
 * @param options - Additional options (notes, isDefault)
 * @returns Created profile with generated ID, or null if failed
 */
export function createClimateProfile(
  name: string,
  location: Location,
  climateData: ClimateData,
  options?: {
    notes?: string;
    isDefault?: boolean;
  }
): ClimateProfile | null {
  try {
    const profiles = getAllClimateProfiles();
    const now = new Date().toISOString();

    // If setting as default, unset other defaults
    if (options?.isDefault) {
      profiles.forEach(p => {
        p.isDefault = false;
        p.updatedAt = now;
      });
    }

    const newProfile: ClimateProfile = {
      id: generateProfileId(),
      name,
      location,
      climateData,
      isDefault: options?.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
      notes: options?.notes
    };

    profiles.push(newProfile);

    if (saveClimateProfiles(profiles)) {
      // Also update default marker if needed
      if (newProfile.isDefault) {
        localStorage.setItem(DEFAULT_PROFILE_KEY, newProfile.id);
      }
      return newProfile;
    }
    return null;
  } catch (error) {
    console.error('Error creating climate profile:', error);
    return null;
  }
}

/**
 * Get a climate profile by ID
 *
 * @param id - Profile ID to retrieve
 * @returns Profile if found, undefined otherwise
 */
export function getClimateProfileById(id: string): ClimateProfile | undefined {
  try {
    const profiles = getAllClimateProfiles();
    return profiles.find(p => p.id === id);
  } catch (error) {
    console.error('Error getting climate profile by ID:', error);
    return undefined;
  }
}

/**
 * Get the default climate profile
 *
 * @returns Default profile if set, undefined otherwise
 */
export function getDefaultClimateProfile(): ClimateProfile | undefined {
  try {
    const defaultId = localStorage.getItem(DEFAULT_PROFILE_KEY);
    if (!defaultId) {
      // Return first profile if no default is set
      const profiles = getAllClimateProfiles();
      return profiles.length > 0 ? profiles[0] : undefined;
    }
    return getClimateProfileById(defaultId);
  } catch (error) {
    console.error('Error getting default climate profile:', error);
    return undefined;
  }
}

/**
 * Update an existing climate profile
 *
 * @param id - ID of profile to update
 * @param updates - Partial profile data to update
 * @returns Updated profile if successful, null otherwise
 */
export function updateClimateProfile(
  id: string,
  updates: Partial<Omit<ClimateProfile, 'id' | 'createdAt'>>
): ClimateProfile | null {
  try {
    const profiles = getAllClimateProfiles();
    const index = profiles.findIndex(p => p.id === id);

    if (index === -1) {
      console.warn(`Climate profile with ID ${id} not found`);
      return null;
    }

    const now = new Date().toISOString();

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      profiles.forEach(p => {
        if (p.id !== id) {
          p.isDefault = false;
        }
      });
    }

    profiles[index] = {
      ...profiles[index],
      ...updates,
      updatedAt: now
    };

    if (saveClimateProfiles(profiles)) {
      // Update default marker if needed
      if (profiles[index].isDefault) {
        localStorage.setItem(DEFAULT_PROFILE_KEY, id);
      }
      return profiles[index];
    }
    return null;
  } catch (error) {
    console.error('Error updating climate profile:', error);
    return null;
  }
}

/**
 * Delete a climate profile
 *
 * @param id - ID of profile to delete
 * @returns True if deleted, false if not found or failed
 */
export function deleteClimateProfile(id: string): boolean {
  try {
    const profiles = getAllClimateProfiles();
    const filtered = profiles.filter(p => p.id !== id);

    if (filtered.length === profiles.length) {
      // Profile not found
      return false;
    }

    const wasDefault = profiles.find(p => p.id === id)?.isDefault;

    if (saveClimateProfiles(filtered)) {
      // If we deleted the default, clear the default marker
      if (wasDefault) {
        localStorage.removeItem(DEFAULT_PROFILE_KEY);
        // Set first remaining as default if available
        if (filtered.length > 0) {
          filtered[0].isDefault = true;
          localStorage.setItem(DEFAULT_PROFILE_KEY, filtered[0].id);
          saveClimateProfiles(filtered);
        }
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting climate profile:', error);
    return false;
  }
}

/**
 * Set a profile as the default
 *
 * @param id - ID of profile to set as default
 * @returns True if successful, false otherwise
 */
export function setDefaultClimateProfile(id: string): boolean {
  const profile = updateClimateProfile(id, { isDefault: true });
  return profile !== null;
}

/**
 * Query climate profiles with filtering and pagination
 *
 * @param filter - Filter criteria
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of results per page
 * @returns Query result with profiles and metadata
 */
export function queryClimateProfiles(
  filter: ClimateProfileFilter = {},
  page: number = 1,
  pageSize: number = 20
): ClimateProfileQueryResult {
  try {
    let profiles = getAllClimateProfiles();

    // Apply filters
    if (filter.query) {
      const query = filter.query.toLowerCase();
      profiles = profiles.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.location.city.toLowerCase().includes(query) ||
        p.location.country.toLowerCase().includes(query) ||
        p.notes?.toLowerCase().includes(query)
      );
    }

    if (filter.country) {
      profiles = profiles.filter(
        p => p.location.country.toLowerCase() === filter.country!.toLowerCase()
      );
    }

    if (filter.climateZone) {
      profiles = profiles.filter(
        p => p.location.climateZone === Number(filter.climateZone)
      );
    }

    if (filter.isDefault !== undefined) {
      profiles = profiles.filter(p => p.isDefault === filter.isDefault);
    }

    // Sort by default first, then by name
    profiles = profiles.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });

    const total = profiles.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProfiles = profiles.slice(startIndex, endIndex);

    return {
      profiles: paginatedProfiles,
      total,
      page,
      pageSize
    };
  } catch (error) {
    console.error('Error querying climate profiles:', error);
    return {
      profiles: [],
      total: 0,
      page,
      pageSize
    };
  }
}

/**
 * Search profiles by name or location (fuzzy match)
 *
 * @param query - Search query
 * @param limit - Maximum number of results
 * @returns Array of matching profiles
 */
export function searchClimateProfiles(
  query: string,
  limit: number = 10
): ClimateProfile[] {
  const result = queryClimateProfiles({ query }, 1, limit);
  return result.profiles;
}

/**
 * Get all unique countries from profiles
 *
 * @returns Array of unique country names
 */
export function getUniqueCountries(): string[] {
  try {
    const profiles = getAllClimateProfiles();
    const countries = new Set(profiles.map(p => p.location.country));
    return Array.from(countries).sort();
  } catch (error) {
    console.error('Error getting unique countries:', error);
    return [];
  }
}

/**
 * Get all unique climate zones from profiles
 *
 * @returns Array of unique climate zones
 */
export function getUniqueClimateZones(): ClimateZone[] {
  try {
    const profiles = getAllClimateProfiles();
    const zones = new Set<ClimateZone>(profiles.map(p => p.location.climateZone));
    return Array.from(zones).sort((a, b) => a - b);
  } catch (error) {
    console.error('Error getting unique climate zones:', error);
    return [];
  }
}

/**
 * Duplicate an existing profile
 *
 * @param id - ID of profile to duplicate
 * @param newName - Optional new name (defaults to "Copy of [original name]")
 * @returns Duplicated profile if successful, null otherwise
 */
export function duplicateClimateProfile(
  id: string,
  newName?: string
): ClimateProfile | null {
  try {
    const original = getClimateProfileById(id);
    if (!original) {
      console.warn(`Climate profile with ID ${id} not found`);
      return null;
    }

    const now = new Date().toISOString();

    return createClimateProfile(
      newName || `Copy of ${original.name}`,
      original.location,
      original.climateData,
      {
        notes: original.notes
          ? `Copied from: ${original.name}\n\n${original.notes}`
          : `Copied from: ${original.name}`
      }
    );
  } catch (error) {
    console.error('Error duplicating climate profile:', error);
    return null;
  }
}

/**
 * Import climate profiles from array
 *
 * @param profiles - Array of profiles to import
 * @param overwrite - Whether to overwrite existing profiles with same name
 * @returns Number of profiles imported
 */
export function importClimateProfiles(
  profiles: Omit<ClimateProfile, 'id' | 'createdAt' | 'updatedAt'>[],
  overwrite: boolean = false
): number {
  try {
    const existingProfiles = getAllClimateProfiles();
    let importedCount = 0;
    const now = new Date().toISOString();

    for (const profile of profiles) {
      const existingIndex = existingProfiles.findIndex(
        p => p.name.toLowerCase() === profile.name.toLowerCase()
      );

      const newProfile: ClimateProfile = {
        ...profile,
        id: generateProfileId(),
        createdAt: now,
        updatedAt: now
      };

      if (existingIndex >= 0) {
        if (overwrite) {
          newProfile.id = existingProfiles[existingIndex].id;
          newProfile.createdAt = existingProfiles[existingIndex].createdAt;
          existingProfiles[existingIndex] = newProfile;
          importedCount++;
        }
      } else {
        existingProfiles.push(newProfile);
        importedCount++;
      }
    }

    if (saveClimateProfiles(existingProfiles)) {
      return importedCount;
    }
    return 0;
  } catch (error) {
    console.error('Error importing climate profiles:', error);
    return 0;
  }
}

/**
 * Export all climate profiles
 *
 * @returns JSON string of exported profiles
 */
export function exportClimateProfiles(): string {
  try {
    const profiles = getAllClimateProfiles();
    return JSON.stringify(profiles, null, 2);
  } catch (error) {
    console.error('Error exporting climate profiles:', error);
    return '[]';
  }
}

/**
 * Clear all climate profiles from storage
 *
 * @returns True if successful, false otherwise
 */
export function clearAllClimateProfiles(): boolean {
  try {
    localStorage.removeItem(CLIMATE_PROFILES_STORAGE_KEY);
    localStorage.removeItem(DEFAULT_PROFILE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing climate profiles:', error);
    return false;
  }
}

/**
 * Validate climate profile data
 *
 * @param profile - Profile to validate
 * @returns Validation result with errors if any
 */
export function validateClimateProfile(
  profile: Partial<ClimateProfile>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!profile.name || profile.name.trim().length === 0) {
    errors.push('Profile name is required');
  }

  if (!profile.location) {
    errors.push('Location is required');
  } else {
    if (!profile.location.city || profile.location.city.trim().length === 0) {
      errors.push('City is required');
    }
    if (!profile.location.country || profile.location.country.trim().length === 0) {
      errors.push('Country is required');
    }
    if (typeof profile.location.lat !== 'number' ||
        profile.location.lat < -90 ||
        profile.location.lat > 90) {
      errors.push('Valid latitude (-90 to 90) is required');
    }
    if (typeof profile.location.lon !== 'number' ||
        profile.location.lon < -180 ||
        profile.location.lon > 180) {
      errors.push('Valid longitude (-180 to 180) is required');
    }
  }

  if (!profile.climateData) {
    errors.push('Climate data is required');
  } else {
    if (typeof profile.climateData.annualAvgTemp !== 'number') {
      errors.push('Annual average temperature is required');
    }
    if (typeof profile.climateData.winterDesignTemp !== 'number') {
      errors.push('Winter design temperature is required');
    }
    if (typeof profile.climateData.summerDesignTemp !== 'number') {
      errors.push('Summer design temperature is required');
    }
    if (typeof profile.climateData.heatingDegreeDays !== 'number' ||
        profile.climateData.heatingDegreeDays < 0) {
      errors.push('Valid heating degree days are required');
    }
    if (typeof profile.climateData.coolingDegreeDays !== 'number' ||
        profile.climateData.coolingDegreeDays < 0) {
      errors.push('Valid cooling degree days are required');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get climate profile statistics
 *
 * @returns Statistics about saved profiles
 */
export function getClimateProfileStatistics(): {
  total: number;
  countries: number;
  climateZones: number;
  defaultSet: boolean;
} {
  try {
    const profiles = getAllClimateProfiles();
    const countries = new Set(profiles.map(p => p.location.country)).size;
    const zones = new Set(profiles.map(p => p.location.climateZone)).size;
    const defaultId = localStorage.getItem(DEFAULT_PROFILE_KEY);

    return {
      total: profiles.length,
      countries,
      climateZones: zones,
      defaultSet: !!defaultId && profiles.some(p => p.id === defaultId)
    };
  } catch (error) {
    console.error('Error getting climate profile statistics:', error);
    return {
      total: 0,
      countries: 0,
      climateZones: 0,
      defaultSet: false
    };
  }
}

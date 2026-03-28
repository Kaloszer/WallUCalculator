/**
 * Stud wall configuration constants
 *
 * Standard configurations for stud wall assemblies used in calculations.
 */

import { StudWallConfig, StudWallType } from '../types/domain';

/**
 * Available I-joist depths in millimeters
 */
export const IJOIST_DEPTHS = [100, 150, 200, 250, 300, 350, 400] as const;

/**
 * Stud wall configuration presets
 *
 * These are the standard configurations for different stud wall types.
 * All values are in millimeters unless otherwise noted.
 */
export const STUD_WALL_CONFIGS: Record<StudWallType, StudWallConfig> = {
  none: {
    type: 'none',
    studWidth: 0,
    studDepth: 0,
    studSpacing: 0,
    studConductivity: 0,
    studArea: 0
  },
  standard: {
    type: 'standard',
    studWidth: 45,      // 2x4 stud (45mm x 90mm)
    studDepth: 150,     // Standard depth (6 inches)
    studSpacing: 400,   // 16 inches on center (400mm)
    studConductivity: 0.12, // Wood thermal conductivity
    studArea: 0.15      // Approximately 15% of wall area
  },
  'i-joist': {
    type: 'i-joist',
    studWidth: 45,      // Flange width
    studDepth: 200,     // Default depth (8 inches)
    studSpacing: 600,   // 24 inches on center (600mm)
    studConductivity: 0.13, // Composite thermal conductivity
    studArea: 0.10      // Approximately 10% of wall area
  }
};

/**
 * Get stud wall configuration by type
 *
 * @param type - Stud wall type
 * @param iJoistDepth - Optional custom I-joist depth
 * @returns Stud wall configuration
 */
export function getStudConfig(type: StudWallType, iJoistDepth?: number): StudWallConfig {
  const config = STUD_WALL_CONFIGS[type];

  // Override depth for i-joist if custom depth provided
  if (type === 'i-joist' && iJoistDepth !== undefined) {
    return {
      ...config,
      studDepth: iJoistDepth
    };
  }

  return config;
}

/**
 * Check if stud wall type has structural studs
 *
 * @param type - Stud wall type
 * @returns True if studs exist
 */
export function hasStuds(type: StudWallType): boolean {
  return type !== 'none';
}

/**
 * Get standard I-joist depth or default
 *
 * @param depth - Requested depth
 * @returns Valid I-joist depth or default 200mm
 */
export function getValidIJoistDepth(depth?: number): number {
  if (depth === undefined) return 200;
  if (IJOIST_DEPTHS.includes(depth as 100 | 200 | 300 | 150 | 400 | 250 | 350)) return depth;
  return 200;
}

/**
 * Collection of utility functions for house visualization calculations
 */

/**
 * Calculates roof height based on angle and width
 * @param angle Roof angle in degrees
 * @param width Width of the house
 * @returns Height of the roof peak from the base wall
 */
export function calculateRoofHeight(angle: number, width: number): number {
  const angleRad = (angle * Math.PI) / 180;
  return Math.tan(angleRad) * (width / 2);
}

/**
 * Calculates the roof hypotenuse (length of each roof panel)
 * @param angle Roof angle in degrees
 * @param width Width of the house
 * @returns Length of the roof panel
 */
export function calculateRoofHypotenuse(angle: number, width: number): number {
  const angleRad = (angle * Math.PI) / 180;
  return width / (2 * Math.cos(angleRad));
}

/**
 * Calculates the full wall height including triangular portion
 * @param baseWallHeight Height of rectangular portion of the wall
 * @param roofHeight Height of the roof peak
 * @returns Total wall height
 */
export function calculateGableWallHeight(baseWallHeight: number, roofHeight: number): number {
  return baseWallHeight + roofHeight;
}

/**
 * Converts dimensions from millimeters to meters
 * @param mm Dimension in millimeters
 * @returns Dimension in meters
 */
export function mmToM(mm: number): number {
  return mm / 1000;
}
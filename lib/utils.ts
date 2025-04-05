import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts dimensions from millimeters to meters
 * @param mm Dimension in millimeters
 * @returns Dimension in meters
 */
export function mmToM(mm: number): number {
  return mm / 1000;
}

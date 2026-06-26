/**
 * Sharing Utilities
 *
 * URL generation, parsing, and QR code functionality
 * for sharing wall assembly configurations
 */

import { WallComponent, StudWallConfig, ExampleWall } from '../types/domain';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

/**
 * Share data structure for URL encoding
 */
export interface ShareData {
  /** Wall components */
  components: Omit<WallComponent, 'id'>[];
  /** Stud wall type */
  studWallType: string;
  /** I-joist depth (if applicable) */
  iJoistDepth?: number;
  /** Share metadata */
  metadata: {
    /** Version of share format */
    version: string;
    /** Timestamp when shared */
    sharedAt: string;
  };
}

/**
 * Share configuration options
 */
export interface ShareConfig {
  /** Include project name in share URL */
  includeProjectName?: boolean;
  /** Compress data to fit QR code limits */
  compress?: boolean;
  /** Custom base URL */
  baseUrl?: string;
}

/**
 * QR code size limits (bytes)
 */
const QR_CODE_LIMITS = {
  /** Low error correction - maximum capacity */
  low: 2953,
  /** Medium error correction */
  medium: 2331,
  /** High error correction */
  high: 1663,
  /** Very high error correction - minimum capacity */
  veryHigh: 1273
};

/**
 * Maximum URL length for QR codes (using medium error correction)
 */
const MAX_QR_URL_LENGTH = QR_CODE_LIMITS.medium;

/**
 * Generate share URL for wall assembly
 *
 * @param components - Wall components
 * @param studWallType - Stud wall type
 * @param iJoistDepth - I-joist depth (optional)
 * @param config - Share configuration
 * @returns Share URL
 */
export function generateShareURL(
  components: WallComponent[],
  studWallType: string,
  iJoistDepth?: number,
  config: ShareConfig = {}
): string {
  const {
    compress = true,
    baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  } = config;

  // Create share data
  const shareData: ShareData = {
    components: components.map(comp => ({
      material: comp.material,
      thickness: comp.thickness,
      conductivity: comp.conductivity,
      isInsulation: comp.isInsulation,
      hasStuds: comp.hasStuds,
      vaporResistance: comp.vaporResistance
    })),
    studWallType,
    iJoistDepth,
    metadata: {
      version: '1.0',
      sharedAt: new Date().toISOString()
    }
  };

  // Serialize data
  let dataString = JSON.stringify(shareData);

  // Compress if enabled
  if (compress) {
    dataString = compressToEncodedURIComponent(dataString);
  }

  // Check if data fits in QR code limit
  const urlLength = dataString.length;
  if (urlLength > MAX_QR_URL_LENGTH) {
    console.warn(`Share URL length (${urlLength} bytes) exceeds QR code limit (${MAX_QR_URL_LENGTH} bytes)`);
  }

  // Generate URL
  return `${baseUrl}?wallAssembly=${encodeURIComponent(dataString)}`;
}

/**
 * Parse wall assembly from share URL
 *
 * @param url - Share URL or search params string
 * @returns Parsed share data or null if invalid
 */
export function parseShareURL(url: string): ShareData | null {
  try {
    // Extract search params
    const params = new URLSearchParams(
      url.includes('?') ? url.split('?')[1] : url
    );

    const assemblyData = params.get('wallAssembly');
    if (!assemblyData) {
      return null;
    }

    // Check if data is compressed
    let dataString = decodeURIComponent(assemblyData);

    // Try to decompress (if it looks like compressed data)
    // Compressed data typically has specific character patterns
    if (isCompressed(dataString)) {
      const decompressed = decompressFromEncodedURIComponent(dataString);
      if (decompressed) {
        dataString = decompressed;
      }
    }

    // Parse JSON
    const shareData = JSON.parse(dataString) as ShareData;

    // Validate structure
    if (!isValidShareData(shareData)) {
      return null;
    }

    return shareData;
  } catch (error) {
    console.error('Failed to parse share URL:', error);
    return null;
  }
}

/**
 * Check if data string appears to be compressed
 */
function isCompressed(data: string): boolean {
  // Compressed data from lz-string has specific patterns
  // It contains only specific characters and has different distribution
  const compressedPattern = /^[A-Za-z0-9\-\_]+$/;
  return compressedPattern.test(data) && data.length < data.length * 1.5;
}

/**
 * Validate share data structure
 */
function isValidShareData(data: any): data is ShareData {
  return (
    data &&
    Array.isArray(data.components) &&
    typeof data.studWallType === 'string' &&
    data.metadata &&
    typeof data.metadata.version === 'string' &&
    typeof data.metadata.sharedAt === 'string'
  );
}

/**
 * Convert share data to example wall
 *
 * @param shareData - Parsed share data
 * @returns Example wall configuration
 */
export function shareDataToExampleWall(shareData: ShareData): ExampleWall {
  return {
    name: `Shared Assembly - ${new Date(shareData.metadata.sharedAt).toLocaleDateString()}`,
    components: shareData.components.map(comp => ({
      ...comp
    })),
    studWallType: shareData.studWallType as any,
    iJoistDepth: shareData.iJoistDepth
  };
}

/**
 * Generate QR code data URL for sharing
 *
 * @param shareURL - Share URL to encode
 * @param size - QR code size in pixels (default: 256)
 * @param errorCorrectionLevel - Error correction level ('L', 'M', 'Q', 'H')
 * @returns Promise resolving to data URL
 */
export async function generateQRCodeDataURL(
  shareURL: string,
  size: number = 256,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M'
): Promise<string> {
  // Using QRCode.js library (client-side generation)
  // This is a placeholder - actual implementation requires qrcode package
  // For now, return the URL as-is
  return shareURL;
}

/**
 * Check if URL contains wall assembly data
 *
 * @param url - URL to check
 * @returns Whether URL contains wall assembly
 */
export function hasWallAssembly(url: string): boolean {
  const params = new URLSearchParams(
    url.includes('?') ? url.split('?')[1] : url
  );
  return params.has('wallAssembly');
}

/**
 * Extract wall assembly from current URL
 *
 * @returns Parsed share data or null
 */
export function getWallAssemblyFromURL(): ShareData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return parseShareURL(window.location.search);
}

/**
 * Clear wall assembly from URL (removes query params)
 *
 * @returns New URL without wall assembly params
 */
export function clearWallAssemblyFromURL(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const url = new URL(window.location.href);
  url.searchParams.delete('wallAssembly');
  return url.toString();
}

/**
 * Copy share URL to clipboard
 *
 * @param shareURL - URL to copy
 * @returns Promise resolving when copied
 */
export async function copyShareURL(shareURL: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(shareURL);
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = shareURL;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * Share wall assembly via Web Share API
 *
 * @param shareURL - URL to share
 * @param title - Share title
 * @param text - Share text description
 * @returns Promise resolving when shared or rejected if not supported
 */
export async function shareViaWebShareAPI(
  shareURL: string,
  title: string = 'Wall Assembly Configuration',
  text: string = 'Check out this wall assembly configuration'
): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    await navigator.share({
      title,
      text,
      url: shareURL
    });
  } else {
    throw new Error('Web Share API not supported');
  }
}

/**
 * Check if Web Share API is available
 *
 * @returns Whether Web Share API is supported
 */
export function isWebShareAPISupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Generate share link for social media
 *
 * @param shareURL - URL to share
 * @param platform - Platform (twitter, facebook, linkedin, email)
 * @returns Formatted share link
 */
export function generateSocialShareLink(
  shareURL: string,
  platform: 'twitter' | 'facebook' | 'linkedin' | 'email',
  text: string = 'Check out this wall assembly configuration'
): string {
  const encodedURL = encodeURIComponent(shareURL);
  const encodedText = encodeURIComponent(text);

  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedURL}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedURL}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedURL}`;
    case 'email':
      return `mailto:?subject=${encodeURIComponent('Wall Assembly Configuration')}&body=${encodedText}%0A%0A${encodedURL}`;
    default:
      return shareURL;
  }
}

/**
 * Validate share URL length for QR code
 *
 * @param url - URL to validate
 * @returns Validation result with status and details
 */
export function validateShareURLForQR(url: string): {
  valid: boolean;
  length: number;
  limit: number;
  percentage: number;
  recommendation?: string;
} {
  const length = url.length;
  const limit = MAX_QR_URL_LENGTH;
  const percentage = (length / limit) * 100;

  if (length <= limit) {
    return {
      valid: true,
      length,
      limit,
      percentage,
      recommendation: percentage > 80
        ? 'URL is approaching QR code limit. Consider reducing data.'
        : undefined
    };
  } else {
    return {
      valid: false,
      length,
      limit,
      percentage,
      recommendation: `URL exceeds QR code limit by ${length - limit} bytes. Remove some components or use a different sharing method.`
    };
  }
}

/**
 * Compress share data if possible
 *
 * @param components - Wall components
 * @returns Compression result
 */
export function tryCompressShareData(
  components: WallComponent[]
): {
  compressed: boolean;
  originalLength: number;
  compressedLength: number;
  compressionRatio: number;
} {
  const data = JSON.stringify(components);
  const compressed = compressToEncodedURIComponent(data);

  return {
    compressed: compressed.length < data.length,
    originalLength: data.length,
    compressedLength: compressed.length,
    compressionRatio: data.length > 0 ? compressed.length / data.length : 1
  };
}

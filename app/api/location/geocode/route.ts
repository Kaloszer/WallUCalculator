/**
 * Geocoding API Route
 *
 * Converts address strings to coordinates using OpenStreetMap Nominatim API.
 * This is a free service with rate limiting (1 request per second).
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Nominatim API response item
 */
interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    state?: string;
    postcode?: string;
  };
  boundingbox: [string, string, string, string];
}

/**
 * Geocoding result
 */
export interface GeocodeResult {
  /** Full display name */
  displayName: string;
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
  /** City/town name */
  city?: string;
  /** Country name */
  country?: string;
  /** State/province/region */
  region?: string;
}

/**
 * GET /api/location/geocode
 *
 * Query parameters:
 * - q: Address or place name to geocode (required)
 * - limit: Maximum number of results (default: 5, max: 10)
 *
 * @example
 * GET /api/location/geocode?q=New+York&limit=3
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(parseInt(limitParam || '5'), 10);

    // Validate query parameter
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Encode query for URL
    const encodedQuery = encodeURIComponent(query.trim());

    // Call Nominatim API
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=${limit}&addressdetails=1`;

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'WallU-Calculator/1.0', // Required by Nominatim usage policy
        'Accept': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      throw new Error(`Nominatim API returned ${response.status}`);
    }

    const data: NominatimResult[] = await response.json();

    // Transform results to our format
    const results: GeocodeResult[] = data.map((item) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      city: item.address.city || item.address.town || item.address.village,
      country: item.address.country,
      region: item.address.state,
    }));

    // Return results
    return NextResponse.json({
      query: query,
      count: results.length,
      results,
    });
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timeout. Please try again.' },
        { status: 504 }
      );
    }

    // Handle other errors
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode address. Please try again.' },
      { status: 500 }
    );
  }
}

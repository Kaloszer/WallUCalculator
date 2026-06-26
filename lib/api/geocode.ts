/**
 * Geocoding (client-side)
 *
 * Converts address strings to coordinates using the OpenStreetMap Nominatim API,
 * called directly from the browser (the app is a static export with no server).
 * Nominatim allows browser CORS requests; the User-Agent header is set by the
 * browser itself and cannot be overridden from fetch.
 */

interface NominatimResult {
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
}

/** Geocoding result */
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
 * Geocode an address/place name to a list of candidate locations.
 *
 * @param query - Address or place name
 * @param limit - Maximum number of results (capped at 10)
 */
export async function geocodeAddress(query: string, limit: number = 5): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const capped = Math.min(limit, 10);
  const url =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}` +
    `&format=json&limit=${capped}&addressdetails=1`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    throw new Error(`Nominatim API returned ${response.status}`);
  }

  const data: NominatimResult[] = await response.json();

  return data.map((item) => ({
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    city: item.address.city || item.address.town || item.address.village,
    country: item.address.country,
    region: item.address.state,
  }));
}

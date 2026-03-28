/**
 * LocationSelector Component
 *
 * Provides address input with geocoding to convert addresses to coordinates.
 * Uses OpenStreetMap Nominatim API for address lookup.
 */

'use client';

import { useState, useCallback } from 'react';
import { MapPin, Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Geocoding result from API
 */
interface GeocodeResult {
  displayName: string;
  lat: number;
  lon: number;
  city?: string;
  country?: string;
  region?: string;
}

/**
 * API response type
 */
interface GeocodeResponse {
  results: GeocodeResult[];
  error?: string;
}

interface LocationSelectorProps {
  /** Callback when location is selected */
  onLocationSelect: (location: { lat: number; lon: number; displayName: string }) => void;
  /** Currently selected location */
  currentLocation?: { lat: number; lon: number; displayName: string };
  /** Placeholder text */
  placeholder?: string;
}

export function LocationSelector({
  onLocationSelect,
  currentLocation,
  placeholder = 'Enter address or city...'
}: LocationSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * Search for location with debouncing
   */
  const handleSearch = useCallback(async (searchQuery: string) => {
    // Clear previous results and error
    setResults([]);
    setError(null);

    // Don't search for empty or very short queries
    if (!searchQuery || searchQuery.trim().length < 2) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/location/geocode/?q=${encodeURIComponent(searchQuery)}&limit=5`);

      if (!response.ok) {
        throw new Error('Failed to search location');
      }

      const data: GeocodeResponse = await response.json();

      if (data.error) {
        setError(data.error);
        setResults([]);
      } else {
        setResults(data.results || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search location');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handle input change with debouncing
   */
  const handleInputChange = useCallback((value: string) => {
    setQuery(value);

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for 500ms debounce
    const timer = setTimeout(() => {
      handleSearch(value);
    }, 500);

    setDebounceTimer(timer);
  }, [debounceTimer, handleSearch]);

  /**
   * Handle location selection
   */
  const handleSelectLocation = useCallback((result: GeocodeResult) => {
    const location = {
      lat: result.lat,
      lon: result.lon,
      displayName: result.displayName
    };

    onLocationSelect(location);
    setQuery(result.displayName);
    setResults([]);
  }, [onLocationSelect]);

  /**
   * Clear current location
   */
  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    onLocationSelect({ lat: 0, lon: 0, displayName: '' });
  }, [onLocationSelect]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location
        </CardTitle>
        <CardDescription>
          Enter an address or city to get climate data for your location
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Input field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {currentLocation?.displayName && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center py-4 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Searching...
            </div>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search results */}
          {!loading && results.length > 0 && (
            <div className="border rounded-md max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectLocation(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-sm">{result.displayName}</div>
                  {result.city && (
                    <div className="text-xs text-gray-500 mt-1">
                      {result.city}, {result.country}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Current location display */}
          {!loading && !error && results.length === 0 && currentLocation?.displayName && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="text-sm font-medium text-blue-900">Selected Location</div>
              <div className="text-sm text-blue-700 mt-1">{currentLocation.displayName}</div>
              <div className="text-xs text-blue-600 mt-1">
                {currentLocation.lat.toFixed(4)}°, {currentLocation.lon.toFixed(4)}°
              </div>
            </div>
          )}

          {/* No results message */}
          {!loading && !error && results.length === 0 && !currentLocation?.displayName && query.length > 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No results found. Try a different search term.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client"

import * as React from "react"
import { MapPin, Search, Save, Trash2, Star, Thermometer, Droplets, Wind, CloudSun, ArrowRightLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { Location, ClimateData, ClimateZone } from "@/lib/types/domain"
import { getClimateZone } from "@/lib/constants/climateZones"
import {
  searchLocations,
  fetchQuickClimateData,
  mapToASHRAEZone,
  formatCoordinates
} from "@/lib/api/weather"
import {
  ClimateProfile,
  getAllClimateProfiles,
  createClimateProfile,
  deleteClimateProfile,
  setDefaultClimateProfile
} from "@/lib/storage/climateStorage"

interface ClimateSelectorProps {
  onLocationSelect?: (location: Location, climateData: ClimateData) => void
  initialProfileId?: string
  className?: string
}

export function ClimateSelector({ onLocationSelect, initialProfileId, className }: ClimateSelectorProps) {
  // Search state
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<Location[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [searchError, setSearchError] = React.useState<string | null>(null)

  // Selection state
  const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null)
  const [climateData, setClimateData] = React.useState<ClimateData | null>(null)
  const [isLoadingClimate, setIsLoadingClimate] = React.useState(false)

  // Saved profiles state
  const [savedProfiles, setSavedProfiles] = React.useState<ClimateProfile[]>([])
  const [activeTab, setActiveTab] = React.useState("search")
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)

  // Load saved profiles on mount
  React.useEffect(() => {
    loadSavedProfiles()
  }, [])

  // Load initial profile if specified
  const initialLoadRef = React.useRef(true)
  React.useEffect(() => {
    if (initialLoadRef.current && initialProfileId && savedProfiles.length > 0) {
      initialLoadRef.current = false
      const profile = savedProfiles.find(p => p.id === initialProfileId)
      if (profile) {
        setSelectedLocation(profile.location)
        setClimateData(profile.climateData)
        onLocationSelect?.(profile.location, profile.climateData)
      }
    }
  }, [initialProfileId, savedProfiles, onLocationSelect])

  const loadSavedProfiles = () => {
    const profiles = getAllClimateProfiles()
    setSavedProfiles(profiles)
  }

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchError(null)

    try {
      const results = await searchLocations(searchQuery, 10)
      setSearchResults(results)

      if (results.length === 0) {
        setSearchError("No locations found. Try a different search term.")
      }
    } catch {
      setSearchError("Error searching for locations. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  // Handle location selection
  const handleLocationSelect = async (location: Location) => {
    setSelectedLocation(location)
    setIsLoadingClimate(true)
    setSearchResults([])
    setSearchQuery(location.city)

    try {
      const data = await fetchQuickClimateData(location.lat, location.lon)
      if (data) {
        setClimateData(data)
        onLocationSelect?.(location, data)
      } else {
        setSearchError("Could not fetch climate data for this location.")
      }
    } catch {
      setSearchError("Error fetching climate data. Please try again.")
    } finally {
      setIsLoadingClimate(false)
    }
  }

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!selectedLocation || !climateData) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const profileName = `${selectedLocation.city}, ${selectedLocation.country}`
      const profile = createClimateProfile(
        profileName,
        selectedLocation,
        climateData,
        { isDefault: savedProfiles.length === 0 }
      )

      if (profile) {
        loadSavedProfiles()
        setActiveTab("saved")
      } else {
        setSaveError("Failed to save climate profile.")
      }
    } catch {
      setSaveError("Error saving climate profile.")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle load profile
  const handleLoadProfile = (profile: ClimateProfile) => {
    setSelectedLocation(profile.location)
    setClimateData(profile.climateData)
    onLocationSelect?.(profile.location, profile.climateData)
    setActiveTab("current")
  }

  // Handle delete profile
  const handleDeleteProfile = (profileId: string) => {
    if (confirm("Are you sure you want to delete this climate profile?")) {
      deleteClimateProfile(profileId)
      loadSavedProfiles()

      // Clear current selection if it was the deleted profile
      if (selectedLocation && savedProfiles.find(p => p.id === profileId)?.location.city === selectedLocation.city) {
        setSelectedLocation(null)
        setClimateData(null)
      }
    }
  }

  // Handle set default
  const handleSetDefault = (profileId: string) => {
    setDefaultClimateProfile(profileId)
    loadSavedProfiles()
  }

  // Get climate zone display info
  const getClimateZoneDisplay = (zone: ClimateZone) => {
    const ashraeZone = mapToASHRAEZone(zone)
    const zoneConfig = getClimateZone(ashraeZone)
    return {
      name: zoneConfig?.description || zone,
      color: zoneConfig?.color || "#888888",
      zone: ashraeZone
    }
  }

  // Format temperature display
  const formatTemp = (temp: number) => `${temp > 0 ? '+' : ''}${temp.toFixed(1)}°C`

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">
            <Search className="mr-2 h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="current">
            <CloudSun className="mr-2 h-4 w-4" />
            Current
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Star className="mr-2 h-4 w-4" />
            Saved ({savedProfiles.length})
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Search Location
              </CardTitle>
              <CardDescription>
                Search for a city to get climate data and design temperatures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter city name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>

              {searchError && (
                <Alert variant="destructive">
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Search Results</Label>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchResults.map((location, index) => (
                      <Button
                        key={`${location.lat}-${location.lon}-${index}`}
                        variant="outline"
                        className="w-full justify-start text-left"
                        onClick={() => handleLocationSelect(location)}
                      >
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{location.city}</div>
                          <div className="text-xs text-muted-foreground">
                            {location.region}{location.region ? ', ' : ''}{location.country}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {formatCoordinates(location.lat, location.lon)}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Current Climate Tab */}
        <TabsContent value="current" className="space-y-4">
          {isLoadingClimate ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin mr-2">
                    <CloudSun className="h-6 w-6" />
                  </div>
                  Loading climate data...
                </div>
              </CardContent>
            </Card>
          ) : selectedLocation && climateData ? (
            <>
              {/* Location Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedLocation.city}</CardTitle>
                      <CardDescription>
                        {selectedLocation.region}{selectedLocation.region ? ', ' : ''}{selectedLocation.country}
                      </CardDescription>
                    </div>
                    {(() => {
                      const zoneInfo = getClimateZoneDisplay(selectedLocation.climateZone)
                      return (
                        <Badge style={{ backgroundColor: zoneInfo.color }}>
                          {zoneInfo.zone} - {zoneInfo.name}
                        </Badge>
                      )
                    })()}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {formatCoordinates(selectedLocation.lat, selectedLocation.lon)}
                  </div>
                </CardContent>
              </Card>

              {/* Climate Data */}
              <div className="grid grid-cols-2 gap-4">
                {/* Temperature Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      Temperature
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Annual Avg</span>
                      <span className="font-medium">{formatTemp(climateData.annualAvgTemp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Winter Design</span>
                      <span className="font-medium text-blue-600">{formatTemp(climateData.winterDesignTemp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Summer Design</span>
                      <span className="font-medium text-orange-600">{formatTemp(climateData.summerDesignTemp)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Humidity Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      Humidity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Annual Avg</span>
                      <span className="font-medium">{climateData.avgHumidity.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Winter</span>
                      <span className="font-medium">{climateData.winterHumidity.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Summer</span>
                      <span className="font-medium">{climateData.summerHumidity.toFixed(0)}%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Degree Days Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4" />
                      Degree Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Heating (HDD18)</span>
                      <span className="font-medium">{climateData.heatingDegreeDays.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Cooling (CDD18)</span>
                      <span className="font-medium">{climateData.coolingDegreeDays.toFixed(0)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Exposure Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Wind className="h-4 w-4" />
                      Wind Exposure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={
                      climateData.windExposure === 'exposed' ? 'destructive' :
                      climateData.windExposure === 'sheltered' ? 'secondary' : 'default'
                    }>
                      {climateData.windExposure.charAt(0).toUpperCase() + climateData.windExposure.slice(1)}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving || savedProfiles.some(p =>
                  p.location.lat === selectedLocation.lat &&
                  p.location.lon === selectedLocation.lon
                )}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {savedProfiles.some(p =>
                  p.location.lat === selectedLocation.lat &&
                  p.location.lon === selectedLocation.lon
                ) ? "Already Saved" : "Save Climate Profile"}
              </Button>

              {saveError && (
                <Alert variant="destructive">
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <CloudSun className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No location selected. Search for a location to view climate data.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab("search")}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search Location
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Saved Profiles Tab */}
        <TabsContent value="saved" className="space-y-4">
          {savedProfiles.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No saved climate profiles yet.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab("search")}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search for Location
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {savedProfiles.map((profile) => (
                <Card key={profile.id} className={cn(
                  "transition-colors",
                  profile.isDefault && "border-primary"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{profile.name}</CardTitle>
                          {profile.isDefault && (
                            <Badge variant="default">Default</Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs">
                          {(() => {
                            const zoneInfo = getClimateZoneDisplay(profile.location.climateZone)
                            return `${zoneInfo.zone} - ${zoneInfo.name}`
                          })()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSetDefault(profile.id)}
                          disabled={profile.isDefault}
                          title="Set as default"
                        >
                          <Star className={cn(
                            "h-4 w-4",
                            profile.isDefault && "fill-primary text-primary"
                          )} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleLoadProfile(profile)}
                          title="Load profile"
                        >
                          <CloudSun className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProfile(profile.id)}
                          title="Delete profile"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="block">Winter</span>
                        <span className="font-medium text-foreground">
                          {formatTemp(profile.climateData.winterDesignTemp)}
                        </span>
                      </div>
                      <div>
                        <span className="block">Summer</span>
                        <span className="font-medium text-foreground">
                          {formatTemp(profile.climateData.summerDesignTemp)}
                        </span>
                      </div>
                      <div>
                        <span className="block">HDD18</span>
                        <span className="font-medium text-foreground">
                          {profile.climateData.heatingDegreeDays.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ClimateSelector

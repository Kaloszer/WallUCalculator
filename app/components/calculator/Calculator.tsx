"use client"

import { Plus, Building2, Database, Shield, Scale, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import { MAX_LAYERS } from "./types"
import { useWallCalculator } from "./context/WallCalculatorContext"
import { ExampleWallSelector } from "./components/ExampleWallSelector"
import { StudWallSelector } from "./components/StudWallSelector"
import { SortableTableRow } from "./SortableTableRow"
import { WallVisualization } from "./WallVisualization"
import { WallVisualization3D } from "./WallVisualization3D"
import { calculateDewPoint } from "@/app/components/calculator/components/DewPointCalculator"
import { useState, useCallback, useMemo } from "react"
import { calculateTotalRValue } from "@/lib/calculations/rValue"
import { calculateThermalPerformance } from "@/lib/calculations/cost"
import { DewPointDisplay } from "./components/DewPointDisplay"
import { TemperatureGradientDisplay } from "./components/TemperatureGradientDisplay"
import MaterialDatabase from "@/app/components/material-database/MaterialDatabase"
import { LocationSelector } from "@/app/components/climate/LocationSelector"
import { ClimateDisplay } from "@/app/components/climate/ClimateDisplay"
import { ComplianceDashboard } from "@/app/components/compliance/ComplianceDashboard"
import ComparisonView from "@/app/components/comparison/ComparisonView"
import { ExportDialog } from "@/app/components/reporting/ExportDialog"
import { ReportGenerator } from "@/app/components/reporting/ReportGenerator"
import { ClimateZone, DEFAULT_CLIMATE_ZONE, CLIMATE_ZONE_DESCRIPTIONS } from "@/lib/data/buildingCodes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function Calculator() {
  const {
    components,
    studWallType,
    addComponent,
    updateComponent,
    removeComponent,
    toggleStuds,
    getStudConfig,
    reorderComponents
  } = useWallCalculator();

  // Get latest stud config - getStudConfig is stabilized via useCallback([studWallType, iJoistDepth])
  const studWallConfig = useMemo(() => getStudConfig(), [getStudConfig]);

  // State hooks (must be before useMemo)
  const [temperature, setTemperature] = useState(20);
  const [humidity, setHumidity] = useState(50);
  const [outsideTemp, setOutsideTemp] = useState(5);
  const [insideRH] = useState(humidity);
  const [outsideRH] = useState(80);

  // Configure sensors (must be at component top level)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Memoize drag handler to prevent unnecessary re-creates
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = components.findIndex(comp => comp.id === active.id);
      const newIndex = components.findIndex(comp => comp.id === over.id);
      reorderComponents(oldIndex, newIndex);
    }
  }, [components, reorderComponents]);

  // Memoize dew point calculation
  const dewPoint = useMemo(() => calculateDewPoint(temperature, humidity), [temperature, humidity]);

  // Compute actual thermal performance for export/reporting
  const totalRValue = useMemo(() => calculateTotalRValue(components, studWallConfig, true), [components, studWallConfig]);
  const performance = useMemo(() => calculateThermalPerformance(components, totalRValue), [components, totalRValue]);

  // Memoize wall assembly object
  const wallAssembly = useMemo(() => ({
    components,
    studWallType
  }), [components, studWallType]);

  // State for new features
  const [selectedLocation, setSelectedLocation] = useState<{lat: number; lon: number; displayName: string; city?: string; country?: string; region?: string} | null>(null);
  const [climateZone, setClimateZone] = useState<ClimateZone>(DEFAULT_CLIMATE_ZONE);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);

  return (
    <div className="space-y-8">
      <Tabs defaultValue="assembly" className="w-full">
        <TabsList className="grid w-full grid-cols-7 mb-8">
          <TabsTrigger value="assembly">Assembly</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="climate">Climate</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="comparison">Compare</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="assembly">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Wall Assembly Configuration</CardTitle>
                  <CardDescription>Configure your wall layers and materials</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowExportDialog(true)}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button variant="outline" onClick={() => setShowReportGenerator(true)}>
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <ExampleWallSelector />
                  <StudWallSelector />
                </div>

                <Button
                  onClick={addComponent}
                  variant="outline"
                  disabled={components.length >= MAX_LAYERS}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Wall Component
                  {components.length >= MAX_LAYERS && " (Max reached)"}
                </Button>

                <Card>
                  <CardContent className="p-4 overflow-x-auto">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead className="w-[50px]">Order</TableHead>
                            <TableHead className="w-[50px]">Actions</TableHead>
                            <TableHead>Material</TableHead>
                            <TableHead>Thickness (mm)</TableHead>
                            <TableHead>R-Value (m²K/W)</TableHead>
                            <TableHead>λ-Value (W/mK)</TableHead>
                            {studWallType !== 'none' && (
                              <TableHead>Stud Insulation</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <SortableContext
                            items={components.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {components.map((component, index) => (
                              <SortableTableRow
                                key={component.id}
                                component={component}
                                index={index}
                                removeComponent={removeComponent}
                                updateComponent={updateComponent}
                                toggleStuds={toggleStuds}
                                showStuds={studWallType !== 'none'}
                              />
                            ))}
                          </SortableContext>
                        </TableBody>
                      </Table>
                    </DndContext>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Material Database
              </CardTitle>
              <CardDescription>Manage custom materials and material properties</CardDescription>
            </CardHeader>
            <CardContent>
              <MaterialDatabase />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="climate">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LocationSelector
              onLocationSelect={(location) => setSelectedLocation(location)}
              currentLocation={selectedLocation ?? undefined}
            />
            <ClimateDisplay
              lat={selectedLocation?.lat ?? NaN}
              lon={selectedLocation?.lon ?? NaN}
              locationName={selectedLocation?.displayName}
            />
          </div>
        </TabsContent>
        <TabsContent value="analysis">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dew Point Analysis</CardTitle>
                <CardDescription>Monitor condensation risks in your wall assembly</CardDescription>
              </CardHeader>
              <CardContent>
                <DewPointDisplay
                  temperature={temperature}
                  humidity={humidity}
                  dewPoint={dewPoint}
                  outsideTemp={outsideTemp}
                  onTemperatureChange={setTemperature}
                  onHumidityChange={setHumidity}
                  onOutsideTempChange={setOutsideTemp}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Temperature Gradient</CardTitle>
                <CardDescription>Analyze temperature distribution through wall layers</CardDescription>
              </CardHeader>
              <CardContent>
                <TemperatureGradientDisplay
                  components={components}
                  insideTemp={temperature}
                  outsideTemp={outsideTemp}
                  dewPoint={dewPoint}
                  insideRH={insideRH}
                  outsideRH={outsideRH}
                  studWallType={studWallType}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance & Standards
              </CardTitle>
              <CardDescription>Check wall assembly against building codes (ASHRAE, IECC, etc.)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Climate Zone:</span>
                <Select
                  value={String(climateZone)}
                  onValueChange={(value) => setClimateZone(Number(value) as ClimateZone)}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select climate zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CLIMATE_ZONE_DESCRIPTIONS) as [string, string][]).map(([zone, description]) => (
                      <SelectItem key={zone} value={zone}>
                        Zone {zone} - {description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ComplianceDashboard
                components={components}
                studWallConfig={studWallConfig}
                climateZone={climateZone}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Wall Assembly Comparison
              </CardTitle>
              <CardDescription>Compare multiple wall assemblies side-by-side</CardDescription>
            </CardHeader>
            <CardContent>
              <ComparisonView />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="visualization">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Wall Visualization</CardTitle>
                <CardDescription>2D and 3D representations of your wall assembly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <WallVisualization components={components} />
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <WallVisualization3D
                      components={components}
                      studWallConfig={studWallConfig}
                      insideTemp={temperature}
                      outsideTemp={outsideTemp}
                      dewPoint={dewPoint}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>House Sample Preview</CardTitle>
                <CardDescription>See your wall assembly in a complete house model</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link
                    href={`/houseSamplePage?wallAssembly=${encodeURIComponent(JSON.stringify(wallAssembly))}`}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Generate House Sample
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        components={components}
        studWallConfig={studWallConfig}
        performance={performance}
        environmental={{
          insideTemp: temperature,
          outsideTemp: outsideTemp,
          dewPoint: dewPoint
        }}
      />

      {/* Report Generator Dialog */}
      <ReportGenerator
        open={showReportGenerator}
        onOpenChange={setShowReportGenerator}
        reportData={{
          components,
          studWallConfig,
          performance,
          insideTemp: temperature,
          outsideTemp: outsideTemp,
          dewPoint: dewPoint,
          generatedAt: new Date()
        }}
      />
    </div>
  );
}

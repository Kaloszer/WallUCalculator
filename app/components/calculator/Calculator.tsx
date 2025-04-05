"use client"

import { Plus, Building2 } from "lucide-react"
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
import { useState } from "react"
import { DewPointDisplay } from "./components/DewPointDisplay"
import { TemperatureGradientDisplay } from "./components/TemperatureGradientDisplay"
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = components.findIndex(comp => comp.id === active.id);
      const newIndex = components.findIndex(comp => comp.id === over.id);
      reorderComponents(oldIndex, newIndex);
    }
  };

  const [temperature, setTemperature] = useState(20);
  const [humidity, setHumidity] = useState(50);
  const [outsideTemp, setOutsideTemp] = useState(5);
  const [insideRH, setInsideRH] = useState(humidity);
  const [outsideRH, setOutsideRH] = useState(80);

  const dewPoint = calculateDewPoint(temperature, humidity);

  const wallAssembly = {
    components,
    studWallType
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="assembly" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="assembly">Wall Assembly</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="assembly">
          <Card>
            <CardHeader>
              <CardTitle>Wall Assembly Configuration</CardTitle>
              <CardDescription>Configure your wall layers and materials</CardDescription>
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
                    <WallVisualization components={components} studWallConfig={getStudConfig()} />
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <WallVisualization3D
                      components={components}
                      studWallConfig={getStudConfig()}
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
    </div>
  );
}

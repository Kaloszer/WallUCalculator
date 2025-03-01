"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { MAX_LAYERS } from "./types"
import { useWallCalculator } from "./context/WallCalculatorContext"
import { ExampleWallSelector } from "./components/ExampleWallSelector"
import { StudWallSelector } from "./components/StudWallSelector"
import { SortableTableRow } from "./SortableTableRow"
import { WallVisualization } from "./WallVisualization"
import { WallVisualization3D } from "./WallVisualization3D"
import { calculateDewPoint } from "@/app/components/calculator/components/DewPointCalculator"
import { useState } from "react"
import { DewPointDisplay } from "./components/DewPointDisplay";
import { TemperatureGradientDisplay } from "./components/TemperatureGradientDisplay"
import Link from "next/link";

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Wall U-Value Calculator</h1>

      <ExampleWallSelector />
      <StudWallSelector />

      <Button
        onClick={addComponent}
        className="mb-4"
        disabled={components.length >= MAX_LAYERS}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Wall Component
        {components.length >= MAX_LAYERS && " (Max reached)"}
      </Button>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WallVisualization components={components} studWallConfig={getStudConfig()} />
        <WallVisualization3D
          components={components}
          studWallConfig={getStudConfig()}
          insideTemp={temperature}
          outsideTemp={outsideTemp}
          dewPoint={dewPoint}
        />
      </div>

      <div className="mt-4">
        <DewPointDisplay
          temperature={temperature}
          humidity={humidity}
          dewPoint={dewPoint}
          outsideTemp={outsideTemp}
          onTemperatureChange={setTemperature}
          onHumidityChange={setHumidity}
          onOutsideTempChange={setOutsideTemp}
        />

        <TemperatureGradientDisplay
          components={components}
          insideTemp={temperature}
          outsideTemp={outsideTemp}
          dewPoint={dewPoint}
          insideRH={insideRH}
          outsideRH={outsideRH}
        />
      </div>

      <div className="mt-4">
        <Link
          href={`/houseSamplePage?wallAssembly=${encodeURIComponent(JSON.stringify(wallAssembly))}`}
        >
          <button className="px-4 py-2 bg-blue-500 text-white rounded">
            Generate House Sample
          </button>
        </Link>
      </div>
    </div>
  );
}

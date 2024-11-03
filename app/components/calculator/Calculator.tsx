"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { WallComponent, commonMaterials, MAX_LAYERS, StudWallType, studWallConfigs, StudWallConfig, IJOIST_DEPTHS, exampleWalls, ExampleWall, logger, calculateRValue, calculateTotalRValue, calculateUValue } from "./types"
import { SortableTableRow } from "./SortableTableRow"
import { WallVisualization } from "./WallVisualization"
import { UValueIndicator } from "./UValueIndicator"
import { WallVisualization3D } from "./WallVisualization3D"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Add validation function
const validateComponent = (component: WallComponent) => {
  if (!component.material) {
    logger('Calculator', 'Invalid component - no material specified', component);
    return false;
  }
  if (component.thickness <= 0) {
    logger('Calculator', 'Invalid component - invalid thickness', component);
    return false;
  }
  return true;
};

export default function Calculator() {
  const [components, setComponents] = useState<WallComponent[]>([])
  const [nextId, setNextId] = useState(1)
  const [studWallType, setStudWallType] = useState<StudWallType>('none')
  const [iJoistDepth, setIJoistDepth] = useState(200)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addComponent = () => {
    if (components.length >= MAX_LAYERS) {
      logger('Calculator', 'Maximum layers reached');
      return;
    }
    setComponents([...components, { 
      id: nextId, 
      material: "", 
      thickness: 0, 
      conductivity: 0, 
      isInsulation: false,
      hasStuds: false 
    }])
    setNextId(nextId + 1)
  }

  const updateComponent = (id: number, updates: Partial<WallComponent>) => {
    logger('Calculator', 'Updating component', { id, updates });
    // Validate updates
    if (updates.thickness && updates.thickness < 0) {
      logger('Calculator', 'Invalid thickness value', updates.thickness);
      return;
    }
    setComponents(components.map(comp => comp.id === id ? { ...comp, ...updates } : comp))
  }

  const removeComponent = (id: number) => {
    setComponents(components.filter(comp => comp.id !== id))
  }

  const toggleStuds = (id: number) => {
    setComponents(components.map(comp => {
      if (comp.id === id) {
        // Toggle the hasStuds value for the target component
        return { ...comp, hasStuds: !comp.hasStuds };
      }
      // If this component has studs and we're enabling studs on another component,
      // remove studs from this component
      if (comp.hasStuds && comp.id !== id) {
        return { ...comp, hasStuds: false };
      }
      return comp;
    }));
  };

  const calculateRValue = (component: WallComponent) => {
    return component.conductivity > 0 ? (component.thickness / 1000) / component.conductivity : 0
  }

  const totalRValue = components.reduce((sum, comp) => sum + calculateRValue(comp), 0)

  const calculateEffectiveRValue = (components: WallComponent[], studConfig: StudWallConfig) => {
    if (studConfig.type === 'none') {
      return totalRValue;
    }

    // Calculate R-value through studs
    const throughStudRValue = components.map(comp => {
      if (comp.isInsulation) {
        // Replace insulation with stud properties in stud area
        return (comp.thickness / 1000) / studConfig.studConductivity;
      }
      return calculateRValue(comp);
    }).reduce((sum, r) => sum + r, 0);

    // Calculate R-value through cavity
    const throughCavityRValue = totalRValue;

    // Calculate effective R-value using parallel path method
    const studFraction = studConfig.studArea;
    const cavityFraction = 1 - studFraction;

    return 1 / ((studFraction / throughStudRValue) + (cavityFraction / throughCavityRValue));
  }

  const effectiveRValue = calculateEffectiveRValue(components, studWallConfigs[studWallType]);
  const uValue = effectiveRValue > 0 ? 1 / effectiveRValue : 0;

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over && event.active.id !== event.over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === Number(event.active.id));
        const newIndex = items.findIndex((item) => item.id === Number(event.over!.id));
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const getStudConfig = () => {
    const baseConfig = studWallConfigs[studWallType];
    if (studWallType === 'i-joist') {
      return {
        ...baseConfig,
        studDepth: iJoistDepth
      };
    }
    return baseConfig;
  };

  const loadExampleWall = (example: ExampleWall) => {
    setStudWallType(example.studWallType);
    if (example.iJoistDepth) {
      setIJoistDepth(example.iJoistDepth);
    }
    const newComponents = example.components.map((comp: Omit<WallComponent, 'id'>, index: number) => ({
      ...comp,
      id: nextId + index,
    }));
    setComponents(newComponents);
    setNextId(nextId + newComponents.length);
  };

  console.log('Calculator rendering with:', {
    studWallType,
    config: studWallConfigs[studWallType]
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Wall U-Value Calculator</h1>

      <div className="mb-4 space-x-2">
        <p className="text-sm text-gray-600 mb-2">Example Walls:</p>
        {exampleWalls.map((example) => (
          <Button
            key={example.name}
            variant="outline"
            onClick={() => loadExampleWall(example)}
          >
            {example.name}
          </Button>
        ))}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Stud Wall Type
        </label>
        <Select
          value={studWallType}
          onValueChange={(value: StudWallType) => setStudWallType(value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select stud wall type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Studs</SelectItem>
            <SelectItem value="standard">Standard Stud Wall</SelectItem>
            <SelectItem value="i-joist">I-Joist Wall</SelectItem>
          </SelectContent>
        </Select>
        
        {studWallType === 'i-joist' && (
          <div className="mt-2">
            <label className="block text-sm font-medium mb-2">
              I-Joist Depth
            </label>
            <Select
              value={iJoistDepth.toString()}
              onValueChange={(value) => setIJoistDepth(Number(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select depth" />
              </SelectTrigger>
              <SelectContent>
                {IJOIST_DEPTHS.map((depth) => (
                  <SelectItem key={depth} value={depth.toString()}>
                    {depth}mm
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {studWallType !== 'none' && (
          <div className="mt-2 text-sm text-gray-600">
            <p>Stud Configuration:</p>
            <ul className="list-disc pl-5">
              <li>Depth: {getStudConfig().studDepth}mm</li>
              <li>Spacing: {getStudConfig().studSpacing}mm c/c</li>
              <li>Area Fraction: {(getStudConfig().studArea * 100).toFixed(1)}%</li>
            </ul>
          </div>
        )}
      </div>
      
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
                  calculateRValue={calculateRValue}
                  toggleStuds={toggleStuds}
                  showStuds={studWallType !== 'none'}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </DndContext>

      <div className="mt-4">
        <p className="text-lg">Total R-Value (no thermal bridging): {totalRValue.toFixed(3)} m²K/W</p>
        <p className="text-lg">Effective R-Value (with thermal bridging): {effectiveRValue.toFixed(3)} m²K/W</p>
        <p className="text-lg font-bold">U-Value: {uValue.toFixed(3)} W/m²K</p>
      </div>

      <UValueIndicator uValue={uValue} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WallVisualization components={components} studWallConfig={getStudConfig()} />
        <WallVisualization3D 
          components={components} 
          studWallConfig={getStudConfig()} 
        />
      </div>
    </div>
  )
}

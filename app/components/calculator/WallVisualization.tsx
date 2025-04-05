import { useState } from "react";
import { WallComponent, commonMaterials, StudWallConfig } from "./types"

interface WallVisualizationProps {
  components: WallComponent[];
  studWallConfig?: StudWallConfig;
}

const getComponentColor = (material: string) => {
  const materialInfo = commonMaterials.find(m => m.name === material)
  return materialInfo ? materialInfo.color : "#95a5a6"
}

const calculateRValue = (component: WallComponent) => {
  return component.conductivity > 0 ? (component.thickness / 1000) / component.conductivity : 0
}

const calculateCost = (component: WallComponent) => {
  const material = commonMaterials.find(m => m.name === component.material)
  return material ? material.cost * component.thickness : 0
}

const calculateCostEffectiveness = (component: WallComponent) => {
  const rValue = calculateRValue(component)
  const cost = calculateCost(component)
  return cost > 0 ? rValue / cost : 0
}

function ComponentDetails({ component }: { component: WallComponent }) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black/90 text-white p-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="text-sm font-medium border-b border-white/20 pb-1 mb-1">{component.material}</div>
      <div className="space-y-0.5">
        <div className="text-xs">Thickness: {component.thickness}mm</div>
        <div className="text-xs">R-Value: {calculateRValue(component).toFixed(2)} m²K/W</div>
        <div className="text-xs">Cost: ${calculateCost(component).toFixed(2)}/m²</div>
        <div className="text-xs">Efficiency: {calculateCostEffectiveness(component).toFixed(3)} m²K/W/$</div>
      </div>
      {/* Arrow pointer */}
      <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-black/90 rotate-45"></div>
    </div>
  );
}

export function WallVisualization({ components, studWallConfig }: WallVisualizationProps) {
  const totalCost = components.reduce((sum, comp) => sum + calculateCost(comp), 0);
  const totalRValue = components.reduce((sum, comp) => sum + calculateRValue(comp), 0);
  const uValue = totalRValue > 0 ? 1 / totalRValue : 0;
  const averageCostEffectiveness = components.length > 0 
    ? components.reduce((sum, comp) => sum + calculateCostEffectiveness(comp), 0) / components.length
    : 0;

  return (
    <div className="mt-4 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Wall Visualization</h2>
        <div className="border rounded-lg bg-white">
          <div className="flex h-48 relative">
            {components.map((component) => (
              <div
                key={component.id}
                style={{
                  width: `${(component.thickness / components.reduce((sum, c) => sum + c.thickness, 0)) * 100}%`,
                  backgroundColor: getComponentColor(component.material),
                }}
                className="h-full relative group cursor-pointer"
              >
                <ComponentDetails component={component} />
                {/* Label at the bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-medium bg-white/90 px-2 py-0.5 rounded-t-md">
                  {component.material}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border rounded-lg bg-white/50 backdrop-blur-sm p-4">
        <h3 className="font-semibold text-lg mb-3">Wall Performance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-slate-600">Total Cost</div>
            <div className="text-2xl font-semibold">${totalCost.toFixed(2)}/m²</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-slate-600">Total R-Value</div>
            <div className="text-2xl font-semibold">{totalRValue.toFixed(2)} m²K/W</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-slate-600">U-Value</div>
            <div className="text-2xl font-semibold">{uValue.toFixed(3)} W/m²K</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-slate-600">Cost Effectiveness</div>
            <div className="text-2xl font-semibold">{averageCostEffectiveness.toFixed(3)} m²K/W/$</div>
          </div>
        </div>
      </div>
    </div>
  );
}

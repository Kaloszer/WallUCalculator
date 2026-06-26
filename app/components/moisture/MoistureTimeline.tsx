"use client";

import { useMemo } from "react";

/**
 * Moisture Timeline Component
 *
 * Displays monthly moisture accumulation as a heatmap visualization
 * showing moisture content distribution across wall layers over time.
 */

interface MoistureTimelineProps {
  monthlyData: Array<{
    month: number;
    monthName: string;
    layerData: Array<{
      material: string;
      moistureAccumulation?: number;
      hasCondensation: boolean;
    }>;
  }>;
  materials: string[];
}

interface CellData {
  month: number;
  layer: number;
  moistureLevel: number;
  hasCondensation: boolean;
}

function getMoistureColor(moistureLevel: number, hasCondensation: boolean): string {
  if (hasCondensation) {
    // Red for condensation zones
    const intensity = Math.min(moistureLevel * 255, 255);
    return `rgba(239, 68, 68, ${0.3 + (intensity / 255) * 0.7})`;
  }

  // Blue gradient for moisture content
  if (moistureLevel <= 0.1) {
    return "rgba(34, 197, 94, 0.1)"; // Green - dry
  } else if (moistureLevel <= 0.3) {
    return "rgba(59, 130, 246, 0.3)"; // Blue - low moisture
  } else if (moistureLevel <= 0.5) {
    return "rgba(59, 130, 246, 0.5)"; // Blue - moderate moisture
  } else if (moistureLevel <= 0.8) {
    return "rgba(59, 130, 246, 0.7)"; // Blue - high moisture
  } else {
    return "rgba(59, 130, 246, 0.9)"; // Blue - very high moisture
  }
}

function getMoistureCategory(moistureLevel: number, hasCondensation: boolean): string {
  if (hasCondensation) return "Condensation";
  if (moistureLevel <= 0.1) return "Dry";
  if (moistureLevel <= 0.3) return "Low";
  if (moistureLevel <= 0.5) return "Moderate";
  if (moistureLevel <= 0.8) return "High";
  return "Very High";
}

export function MoistureTimeline({
  monthlyData,
  materials,
}: MoistureTimelineProps) {
  const gridData = useMemo<CellData[]>(() => {
    const data: CellData[] = [];
    monthlyData.forEach((month) => {
      month.layerData.forEach((layer, layerIndex) => {
        data.push({
          month: month.month,
          layer: layerIndex,
          moistureLevel: layer.moistureAccumulation || 0,
          hasCondensation: layer.hasCondensation,
        });
      });
    });
    return data;
  }, [monthlyData]);

  const months = monthlyData.map(m => m.monthName);

  // Calculate statistics
  const avgMoisture = gridData.reduce((sum, d) => sum + d.moistureLevel, 0) / gridData.length;
  const condensationCount = gridData.filter(d => d.hasCondensation).length;
  const criticalLayers = materials.filter((_, idx) =>
    gridData.some(d => d.layer === idx && d.hasCondensation)
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Monthly Moisture Heatmap</h3>
        <p className="text-sm text-gray-600">
          Moisture content distribution across wall layers throughout the year.
          Darker colors indicate higher moisture content. Red cells indicate condensation zones.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-green-200" />
          <span>Dry (&lt;0.1 kg/m²)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-300" />
          <span>Low (0.1-0.3 kg/m²)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-500" />
          <span>Moderate (0.3-0.5 kg/m²)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-700" />
          <span>High (0.5-0.8 kg/m²)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-red-500" />
          <span>Condensation</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left border border-gray-300 bg-gray-50 sticky left-0 bg-gray-50 z-10">
                Layer
              </th>
              {months.map(month => (
                <th
                  key={month}
                  className="p-2 text-center border border-gray-300 bg-gray-50 whitespace-nowrap"
                >
                  {month.substring(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {materials.map((material, layerIdx) => (
              <tr key={layerIdx}>
                <td className="p-2 text-left border border-gray-300 bg-gray-50 sticky left-0 bg-gray-50 z-10 font-medium text-sm">
                  {material.substring(0, 15)}
                  {material.length > 15 && "..."}
                </td>
                {months.map((_, monthIdx) => {
                  const cellData = gridData.find(
                    d => d.month === monthIdx && d.layer === layerIdx
                  );
                  if (!cellData) return <td key={monthIdx} className="p-2 border border-gray-300" />;

                  const backgroundColor = getMoistureColor(
                    cellData.moistureLevel,
                    cellData.hasCondensation
                  );

                  return (
                    <td
                      key={monthIdx}
                      className="p-2 border border-gray-300 text-center text-xs cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor }}
                      title={`${months[monthIdx]} - ${material}: ${getMoistureCategory(
                        cellData.moistureLevel,
                        cellData.hasCondensation
                      )} (${cellData.moistureLevel.toFixed(3)} kg/m²)`}
                    >
                      {cellData.moistureLevel > 0 ? cellData.moistureLevel.toFixed(2) : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-semibold text-blue-800 mb-1">Average Moisture</h4>
          <p className="text-2xl font-bold text-blue-600">
            {avgMoisture.toFixed(3)} kg/m²
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Across all layers and months
          </p>
        </div>

        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="font-semibold text-red-800 mb-1">Condensation Events</h4>
          <p className="text-2xl font-bold text-red-600">
            {condensationCount}
          </p>
          <p className="text-sm text-red-600 mt-1">
            {condensationCount === 0 ? "No condensation detected" : "Months with condensation"}
          </p>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
          <h4 className="font-semibold text-amber-800 mb-1">Critical Layers</h4>
          <p className="text-2xl font-bold text-amber-600">
            {criticalLayers.length}
          </p>
          <p className="text-sm text-amber-600 mt-1">
            {criticalLayers.length === 0 ? "No critical issues" : "Layers at risk"}
          </p>
        </div>
      </div>

      {/* Critical Layers Detail */}
      {criticalLayers.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-md">
          <h4 className="font-semibold text-amber-800 mb-2">Layers with Condensation Risk</h4>
          <ul className="space-y-1">
            {criticalLayers.map((layer, idx) => (
              <li key={idx} className="text-sm text-amber-700">
                {layer}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

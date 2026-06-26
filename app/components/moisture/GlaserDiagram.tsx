"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Glaser Diagram Component
 *
 * Displays vapor pressure and saturation pressure through wall assembly
 * using dual-axis chart to identify condensation zones.
 */

interface GlaserDataPoint {
  position: number;
  vaporPressure: number;
  saturationPressure: number;
  temperature: number;
  material: string;
}

interface GlaserDiagramProps {
  vaporPressures: number[];
  saturationPressures: number[];
  temperatures: number[];
  materials: string[];
}

function GlaserChart({
  chartData,
}: {
  chartData: GlaserDataPoint[];
}) {
  const chartRef = useRef<ChartJS<"line">>(null);

  if (!chartData.length) {
    return (
      <div className="h-[400px] flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  const positions = chartData.map(point => point.position.toFixed(3));
  const materials = chartData.map(point => point.material);

  const data: ChartData<"line"> = {
    labels: positions,
    datasets: [
      {
        label: "Vapor Pressure (Pa)",
        data: chartData.map(point => point.vaporPressure),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        yAxisID: "y",
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Saturation Pressure (Pa)",
        data: chartData.map(point => point.saturationPressure),
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        yAxisID: "y",
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Temperature (°C)",
        data: chartData.map(point => point.temperature),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        yAxisID: "y1",
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Position (m)",
          font: {
            weight: "bold",
          },
        },
        ticks: {
          callback: function (value, index) {
            return `${positions[index]}\n${materials[index]?.substring(0, 10)}${materials[index]?.length > 10 ? "..." : ""}`;
          },
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          },
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Pressure (Pa)",
          font: {
            weight: "bold",
          },
        },
        beginAtZero: true,
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: "Temperature (°C)",
          font: {
            weight: "bold",
          },
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: "Glaser Method: Vapor Pressure Distribution",
        font: {
          size: 16,
          weight: "bold",
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const idx = context[0].dataIndex;
            return `Position: ${positions[idx]}m (${materials[idx] || ""})`;
          },
          label: (context) => {
            const value = context.raw as number;
            const label = context.dataset.label || "";
            return `${label}: ${value.toFixed(2)}`;
          },
        },
      },
    },
  };

  return (
    <div className="h-[400px] w-full">
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}

export function GlaserDiagram({
  vaporPressures,
  saturationPressures,
  temperatures,
  materials,
}: GlaserDiagramProps) {
  const [chartData, setChartData] = useState<GlaserDataPoint[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [condensationZones, setCondensationZones] = useState<number[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!vaporPressures.length || !saturationPressures.length) return;

    // Prepare chart data
    const data: GlaserDataPoint[] = [];
    const zones: number[] = [];

    for (let i = 0; i < vaporPressures.length; i++) {
      const hasCondensation = vaporPressures[i] >= saturationPressures[i];
      if (hasCondensation) {
        zones.push(i);
      }

      data.push({
        position: i * 0.01, // Simplified position calculation
        vaporPressure: vaporPressures[i],
        saturationPressure: saturationPressures[i],
        temperature: temperatures[i],
        material: materials[i] || `Layer ${i + 1}`,
      });
    }

    setChartData(data);
    setCondensationZones(zones);
  }, [vaporPressures, saturationPressures, temperatures, materials]);

  if (!isClient) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        Loading chart...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GlaserChart chartData={chartData} />

      {condensationZones.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-md">
          <h3 className="font-semibold text-red-800 mb-2">
            Condensation Zones Detected
          </h3>
          <p className="text-red-700 text-sm">
            Vapor pressure exceeds saturation pressure at {condensationZones.length} location(s).
            Condensation will occur in these areas.
          </p>
          <ul className="mt-2 space-y-1">
            {condensationZones.map((zone, index) => (
              <li key={index} className="text-sm text-red-600">
                Zone {index + 1}: Position {chartData[zone]?.position.toFixed(3)}m ({chartData[zone]?.material})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-semibold text-blue-800 mb-1">Vapor Pressure Range</h4>
          <p className="text-2xl font-bold text-blue-600">
            {Math.min(...vaporPressures).toFixed(0)} - {Math.max(...vaporPressures).toFixed(0)} Pa
          </p>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
          <h4 className="font-semibold text-orange-800 mb-1">Saturation Pressure Range</h4>
          <p className="text-2xl font-bold text-orange-600">
            {Math.min(...saturationPressures).toFixed(0)} - {Math.max(...saturationPressures).toFixed(0)} Pa
          </p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="font-semibold text-green-800 mb-1">Temperature Range</h4>
          <p className="text-2xl font-bold text-green-600">
            {Math.min(...temperatures).toFixed(1)} - {Math.max(...temperatures).toFixed(1)} °C
          </p>
        </div>
      </div>
    </div>
  );
}

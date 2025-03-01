"use client";
import { useEffect, useState, useRef } from "react";
import {
  calculateTemperatures,
  calculateVaporPressureGradient,
  checkCondensationRisk,
  findDewPointPosition,
} from "./TemperatureGradient";
import { WallComponent, StudWallType } from "../types";
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
import AnnotationPlugin from "chartjs-plugin-annotation";
import { Line } from "react-chartjs-2";
import { Suspense } from "react";

// Register Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  AnnotationPlugin
);

interface ChartDataPoint {
  position: number;
  temperature: number;
  vaporPressure: number;
  saturationPressure: number;
  material: string;
}

interface CondensationRisk {
  hasRisk: boolean;
  riskLayers: number[];
  vaporPressureRisk: boolean;
  saturationPoints: number[];
}

interface TemperatureGradientDisplayProps {
  components: WallComponent[];
  insideTemp: number;
  outsideTemp: number;
  dewPoint: number;
  insideRH: number;
  outsideRH: number;
  studWallType: StudWallType;
}

// Chart component separated for client-side rendering
function GradientChart({
  chartData,
  dewPoint,
  dewPointPosition,
}: {
  chartData: ChartDataPoint[];
  dewPoint: number;
  dewPointPosition: number | null;
}) {
  const chartRef = useRef<ChartJS<"line">>(null);

  if (!chartData.length) {
    return <div className="h-[300px] flex items-center justify-center">No data available</div>;
  }

  const positions = chartData.map(point => point.position.toFixed(3));
  const materials = chartData.map(point => point.material);

  const data: ChartData<"line"> = {
    labels: positions,
    datasets: [
      {
        label: "Temperature (°C)",
        data: chartData.map(point => point.temperature),
        borderColor: "rgb(136, 132, 216)",
        backgroundColor: "rgba(136, 132, 216, 0.5)",
        yAxisID: "y",
        tension: 0.1,
      },
      {
        label: "Vapor Pressure (Pa)",
        data: chartData.map(point => point.vaporPressure),
        borderColor: "rgb(130, 202, 157)",
        backgroundColor: "rgba(130, 202, 157, 0.5)",
        yAxisID: "y1",
        tension: 0.1,
      },
      {
        label: "Saturation Pressure (Pa)",
        data: chartData.map(point => point.saturationPressure),
        borderColor: "rgb(255, 115, 0)",
        backgroundColor: "rgba(255, 115, 0, 0.5)",
        yAxisID: "y1",
        tension: 0.1,
      },
      {
        label: `Dew Point (${dewPoint.toFixed(1)}°C)`,
        data: chartData.map(() => dewPoint), // Same value for all x positions
        borderColor: "rgb(255, 0, 0)",
        backgroundColor: "rgba(255, 0, 0, 0.5)",
        yAxisID: "y",
        borderDash: [5, 5],
        pointRadius: 0, // Hide points
        tension: 0,    // Straight line
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: "Position (m)",
        },
        ticks: {
          callback: function (value, index) {
            // Show position and material name for better context
            return `${positions[index]}\n${materials[index] || ""}`;
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Temperature (°C)",
        },
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
          text: "Pressure (Pa)",
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: (context) => {
            const idx = context[0].dataIndex;
            return `Position: ${positions[idx]}m (${materials[idx] || ""})`;
          },
          label: (context) => {
            const value = context.raw as number;
            return `${context.dataset.label}: ${value.toFixed(2)}`;
          },
        },
      },
    },
  };

  return (
    <div className="h-[300px] w-full">
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}

export function TemperatureGradientDisplay({
  components,
  insideTemp,
  outsideTemp,
  dewPoint,
  insideRH,
  outsideRH,
  studWallType,
}: TemperatureGradientDisplayProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [dewPointPosition, setDewPointPosition] = useState<number | null>(null);
  const [condensationRisk, setCondensationRisk] = useState<CondensationRisk>({
    hasRisk: false,
    riskLayers: [],
    vaporPressureRisk: false,
    saturationPoints: [],
  });
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<{ temps: number[]; dewPoint: number }>({
    temps: [],
    dewPoint: 0,
  });

  // Set isClient to true when component mounts to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!components.length) return;

    try {
      // Use the standalone functions directly instead of instantiating a class
      const temperatures = calculateTemperatures(components, insideTemp, outsideTemp, studWallType);
      const vaporPressures = calculateVaporPressureGradient(
        components,
        insideTemp,
        outsideTemp,
        insideRH,
        outsideRH,
        studWallType
      );
      const saturationPressures = temperatures.map((temp) =>
        610.7 * Math.pow(10, (7.5 * temp) / (237.3 + temp))
      );
      const dewPointPos = findDewPointPosition(
        components,
        insideTemp,
        outsideTemp,
        dewPoint,
        studWallType
      );
      const risk = checkCondensationRisk(
        temperatures,
        dewPoint,
        components,
        insideRH,
        outsideRH,
        studWallType
      );

      // Log dewPointPosition for debugging
      console.log("Dew Point Position:", dewPointPos);

      // Store debug info
      setDebugInfo({
        temps: [...temperatures],
        dewPoint,
      });

      // Prepare chart data
      let cumulativeThickness = 0;
      const data: ChartDataPoint[] = [
        {
          position: 0,
          temperature: insideTemp,
          vaporPressure: vaporPressures[0],
          saturationPressure: saturationPressures[0],
          material: "Inside",
        },
      ];

      components.forEach((component, index) => {
        cumulativeThickness += component.thickness / 1000;
        data.push({
          position: cumulativeThickness,
          temperature: temperatures[index + 1],
          vaporPressure: vaporPressures[index + 1],
          saturationPressure: saturationPressures[index + 1],
          material: component.material,
        });
      });

      setChartData(data);
      setDewPointPosition(dewPointPos);
      setCondensationRisk(risk);
      setError(null);
    } catch (err) {
      console.error("Error calculating temperature gradient:", err);
      setError(`Failed to calculate temperature gradient: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [components, insideTemp, outsideTemp, dewPoint, insideRH, outsideRH, studWallType]);

  // Don’t render chart until client-side to prevent hydration issues
  if (!isClient) {
    return <div className="mt-4 h-[300px] w-full flex items-center justify-center">Loading chart...</div>;
  }

  if (error) {
    return <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-md text-red-600">{error}</div>;
  }

  // Find the materials where condensation risk occurs
  const riskMaterials = condensationRisk.riskLayers.map((layerIndex) => {
    return components[layerIndex]?.material || `Layer ${layerIndex + 1}`;
  });

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Temperature & Vapor Pressure Gradient</h2>

      <Suspense fallback={<div className="h-[300px] flex items-center justify-center">Loading chart...</div>}>
        {chartData.length > 0 && (
          <GradientChart chartData={chartData} dewPoint={dewPoint} dewPointPosition={dewPointPosition} />
        )}
      </Suspense>

      <div className="mt-4 p-4 rounded-md bg-blue-50 text-blue-800 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold">Temperature Assessment:</p>
            {dewPointPosition !== null ? (
              <p>
                Dew point ({dewPoint.toFixed(1)}°C) occurs at position:{" "}
                <span className="font-semibold">{dewPointPosition.toFixed(3)}m</span>
              </p>
            ) : (
              <p>No dew point intersection detected in the wall assembly.</p>
            )}
          </div>
          <div>
            <p className="font-semibold">Inside Temperature: {insideTemp.toFixed(1)}°C</p>
            <p className="font-semibold">Outside Temperature: {outsideTemp.toFixed(1)}°C</p>
          </div>
        </div>

        {condensationRisk.hasRisk && (
          <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded-md text-red-600">
            <p className="font-semibold">⚠️ Condensation Risk Detected</p>
            <p>Risk in materials: {riskMaterials.join(", ")}</p>
          </div>
        )}

        {condensationRisk.vaporPressureRisk && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-md text-amber-700">
            <p className="font-semibold">⚠️ Vapor Pressure Warning</p>
            <p>Vapor pressure exceeds saturation pressure in some layers of the wall assembly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
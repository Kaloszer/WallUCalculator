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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlaserDiagram } from "@/app/components/moisture/GlaserDiagram";
import { MoistureTimeline } from "@/app/components/moisture/MoistureTimeline";
import { CondensationAlert } from "@/app/components/moisture/CondensationAlert";
import {
  calculateAnnualMoistureAnalysis,
  performGlaserAnalysis,
  generateDefaultMonthlyClimate,
  assessMouldRisk,
  type AnnualMoistureAnalysis,
  type GlaserAnalysisResult,
  type MonthlyClimateData,
} from "@/lib/calculations/moisture";

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
  /** Real monthly climate normals from the selected location (falls back to a default profile) */
  monthlyClimate?: MonthlyClimateData[];
  /** Display name of the location the monthly climate came from */
  climateLocationName?: string;
}

// Chart component separated for client-side rendering
function GradientChart({
  chartData,
  dewPoint,
}: {
  chartData: ChartDataPoint[];
  dewPoint: number;
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
  monthlyClimate,
  climateLocationName,
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
  const [moistureAnalysis, setMoistureAnalysis] = useState<{
    annual: AnnualMoistureAnalysis | null;
    glaser: GlaserAnalysisResult | null;
    monthlyClimate: MonthlyClimateData[] | null;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("gradient");

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

      // Perform annual moisture analysis
      const monthlyClimateData =
        monthlyClimate && monthlyClimate.length === 12
          ? monthlyClimate
          : generateDefaultMonthlyClimate();
      const annualAnalysis = calculateAnnualMoistureAnalysis(
        components,
        insideTemp,
        insideRH,
        monthlyClimateData,
        studWallType
      );

      // Perform Glaser analysis for current conditions
      const glaserResult = performGlaserAnalysis(
        components,
        insideTemp,
        insideRH,
        outsideTemp,
        outsideRH,
        studWallType
      );

      // Log dewPointPosition for debugging
      console.log("Dew Point Position:", dewPointPos);

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
      setMoistureAnalysis({
        annual: annualAnalysis,
        glaser: glaserResult,
        monthlyClimate: monthlyClimateData,
      });
      setError(null);
    } catch (err) {
      console.error("Error calculating temperature gradient:", err);
      setError(`Failed to calculate temperature gradient: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [components, insideTemp, outsideTemp, dewPoint, insideRH, outsideRH, studWallType, monthlyClimate]);

  // Don't render chart until client-side to prevent hydration issues
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
      <h2 className="text-xl font-semibold mb-2">Temperature & Moisture Analysis</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gradient">Temperature Gradient</TabsTrigger>
          <TabsTrigger value="glaser">Glaser Diagram</TabsTrigger>
          <TabsTrigger value="timeline">Moisture Timeline</TabsTrigger>
          <TabsTrigger value="alerts">Condensation Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="gradient" className="space-y-4">
          <Suspense fallback={<div className="h-[300px] flex items-center justify-center">Loading chart...</div>}>
            {chartData.length > 0 && (
              <GradientChart chartData={chartData} dewPoint={dewPoint} />
            )}
          </Suspense>

          <div className="p-4 rounded-md bg-blue-50 text-blue-800 space-y-2">
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
                <p>Vapor pressure exceeds saturation pressure in some layers of wall assembly.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="glaser" className="space-y-4">
          {moistureAnalysis && moistureAnalysis.glaser && (
            <GlaserDiagram
              vaporPressures={moistureAnalysis.glaser.vaporPressures}
              saturationPressures={moistureAnalysis.glaser.saturationPressures}
              temperatures={moistureAnalysis.glaser.temperatures}
              materials={["Inside Surface", ...components.map(c => c.material)]}
            />
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          {moistureAnalysis && moistureAnalysis.annual && (
            <>
              {(() => {
                const mould = assessMouldRisk(moistureAnalysis.annual.monthlyData);
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const styles = {
                  low: "bg-green-100 text-green-800 border-green-300",
                  elevated: "bg-yellow-100 text-yellow-800 border-yellow-300",
                  high: "bg-red-100 text-red-800 border-red-300",
                } as const;
                const labels = { low: "Low mould risk", elevated: "Elevated mould risk", high: "High mould risk" } as const;
                return (
                  <div className={`flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm ${styles[mould.level]}`}>
                    <span className="font-semibold">{labels[mould.level]}</span>
                    <span>· peak surface RH {mould.maxSurfaceRH}% in {monthNames[mould.worstMonth]}</span>
                    {mould.monthsAtRisk > 0 && <span>· {mould.monthsAtRisk} month(s) above the 80% threshold</span>}
                  </div>
                );
              })()}
              <p className="text-xs text-muted-foreground">
                {monthlyClimate && monthlyClimate.length === 12 && climateLocationName
                  ? `Annual analysis uses real climate normals for ${climateLocationName}.`
                  : "Annual analysis uses a default temperate climate — select a location in the Climate tab for local data."}
              </p>
              <MoistureTimeline
                monthlyData={moistureAnalysis.annual.monthlyData}
                materials={components.map(c => c.material)}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {moistureAnalysis && moistureAnalysis.annual && (
            <CondensationAlert
              condensationRisk={moistureAnalysis.annual.condensationRisk}
              monthlyData={moistureAnalysis.annual.monthlyData}
              dryingPotential={moistureAnalysis.annual.dryingPotential}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

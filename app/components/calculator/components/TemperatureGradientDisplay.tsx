"use client";
import { useEffect, useState } from "react";
import {
  calculateTemperatures,
  calculateVaporPressureGradient,
  checkCondensationRisk,
  findDewPointPosition,
} from "./TemperatureGradient";
import { WallComponent } from "../types";
import { calculateDewPoint } from "./DewPointCalculator";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface TemperatureGradientDisplayProps {
  components: WallComponent[];
  insideTemp: number;
  outsideTemp: number;
  dewPoint: number;
  insideRH: number;
  outsideRH: number;
}

export function TemperatureGradientDisplay({
  components,
  insideTemp,
  outsideTemp,
  dewPoint,
  insideRH,
  outsideRH,
}: TemperatureGradientDisplayProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [condensationRisk, setCondensationRisk] = useState<{
    hasRisk: boolean;
    riskLayers: number[];
    vaporPressureRisk: boolean;
    saturationPoints: number[];
  }>({
    hasRisk: false,
    riskLayers: [],
    vaporPressureRisk: false,
    saturationPoints: [],
  });

  useEffect(() => {
    // Use the standalone functions directly instead of instantiating a class
    const temperatures = calculateTemperatures(components, insideTemp, outsideTemp);
    const vaporPressures = calculateVaporPressureGradient(
      components,
      insideTemp,
      outsideTemp,
      insideRH,
      outsideRH
    );
    const saturationPressures = temperatures.map((temp) =>
      610.7 * Math.pow(10, (7.5 * temp) / (237.3 + temp))
    );
    const dewPointPosition = findDewPointPosition(
      components,
      insideTemp,
      outsideTemp,
      dewPoint
    );
    const risk = checkCondensationRisk(temperatures, dewPoint, components);

    // Prepare chart data
    let cumulativeThickness = 0;
    const data = [
      { position: 0, temperature: insideTemp, vaporPressure: vaporPressures[0], saturationPressure: saturationPressures[0] },
    ];

    components.forEach((component, index) => {
      cumulativeThickness += component.thickness / 1000;
      data.push({
        position: cumulativeThickness,
        temperature: temperatures[index + 1],
        vaporPressure: vaporPressures[index + 1],
        saturationPressure: saturationPressures[index + 1],
      });
    });

    setChartData(data);
    setCondensationRisk(risk);
  }, [components, insideTemp, outsideTemp, dewPoint, insideRH, outsideRH]);

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Temperature & Vapor Pressure Gradient</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="position"
            label={{ value: "Position (m)", position: "insideBottomRight", offset: -5 }}
          />
          <YAxis
            yAxisId="left"
            label={{ value: "Temperature (°C)", angle: -90, position: "insideLeft" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: "Pressure (Pa)", angle: 90, position: "insideRight" }}
          />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            stroke="#8884d8"
            name="Temperature"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="vaporPressure"
            stroke="#82ca9d"
            name="Vapor Pressure"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="saturationPressure"
            stroke="#ff7300"
            name="Saturation Pressure"
          />
        </LineChart>
      </ResponsiveContainer>
      {condensationRisk.hasRisk && (
        <p className="text-red-500 mt-2">
          Condensation risk detected at layers: {condensationRisk.riskLayers.join(", ")}
        </p>
      )}
      {condensationRisk.vaporPressureRisk && (
        <p className="text-red-500 mt-2">
          Vapor pressure exceeds saturation at layers: {condensationRisk.saturationPoints.join(", ")}
        </p>
      )}
    </div>
  );
}
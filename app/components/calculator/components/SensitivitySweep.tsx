"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { calculateTotalRValue } from "@/lib/calculations/rValue";
import type { WallComponent, StudWallConfig } from "@/lib/types/domain";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface SensitivitySweepProps {
  components: WallComponent[];
  studWallConfig?: StudWallConfig;
}

const MIN_MM = 25;
const MAX_MM = 400;
const STEP_MM = 25;

/**
 * Sweeps the primary insulation layer's thickness and plots the resulting
 * whole-wall U-value, so the diminishing-returns "knee" is obvious.
 */
export function SensitivitySweep({ components, studWallConfig }: SensitivitySweepProps) {
  const sweep = useMemo(() => {
    // Pick the thickest insulation layer as the one to vary.
    let targetIndex = -1;
    let targetThickness = 0;
    components.forEach((component, index) => {
      if (component.isInsulation && component.thickness > targetThickness) {
        targetThickness = component.thickness;
        targetIndex = index;
      }
    });
    if (targetIndex === -1) return null;

    const thicknesses: number[] = [];
    for (let t = MIN_MM; t <= MAX_MM; t += STEP_MM) thicknesses.push(t);

    const uValues = thicknesses.map((thickness) => {
      const variant = components.map((component, index) =>
        index === targetIndex ? { ...component, thickness } : component
      );
      const rValue = calculateTotalRValue(variant, studWallConfig, true);
      return rValue > 0 ? 1 / rValue : 0;
    });

    // Diminishing-returns knee: first step where adding STEP_MM improves U by < 0.01 W/m²K.
    let kneeThickness: number | null = null;
    for (let i = 1; i < uValues.length; i++) {
      if (uValues[i - 1] - uValues[i] < 0.01) {
        kneeThickness = thicknesses[i - 1];
        break;
      }
    }

    return {
      layerName: components[targetIndex].material,
      currentThickness: components[targetIndex].thickness,
      thicknesses,
      uValues,
      kneeThickness,
    };
  }, [components, studWallConfig]);

  if (!sweep) {
    return (
      <p className="text-sm text-muted-foreground">
        Add an insulation layer to the assembly to see how its thickness affects the U-value.
      </p>
    );
  }

  const data = {
    labels: sweep.thicknesses.map((t) => `${t}`),
    datasets: [
      {
        label: "U-value (W/m²K)",
        data: sweep.uValues,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: { label: string }[]) => `${items[0].label} mm`,
          label: (ctx: { raw: unknown }) => `U-value: ${(ctx.raw as number).toFixed(3)} W/m²K`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: `${sweep.layerName} thickness (mm)` } },
      y: { title: { display: true, text: "U-value (W/m²K)" }, beginAtZero: true },
    },
  };

  return (
    <div className="space-y-3">
      <div className="h-[300px] w-full">
        <Line data={data} options={options} />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <span>
          Current: <span className="font-medium text-foreground">{sweep.currentThickness} mm</span>
        </span>
        {sweep.kneeThickness !== null && (
          <span>
            Diminishing returns beyond{" "}
            <span className="font-medium text-foreground">{sweep.kneeThickness} mm</span> — thicker
            insulation adds little.
          </span>
        )}
      </div>
    </div>
  );
}

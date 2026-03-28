"use client";

import { useMemo } from 'react';
import { AssemblyMetrics, WallAssembly } from '@/lib/calculations/comparison';
import { calculateCostBreakdown } from '@/lib/calculations/comparison';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import { Badge } from '@/components/ui/badge';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

interface ComparisonChartsProps {
  assemblies: AssemblyMetrics[];
  wallAssemblies: WallAssembly[];
  bestPerformingIndex: number;
  mostEfficientIndex: number;
}

export function ComparisonCharts({
  assemblies,
  wallAssemblies,
  bestPerformingIndex,
  mostEfficientIndex
}: ComparisonChartsProps) {
  const colors = [
    { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgb(59, 130, 246)' },
    { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgb(34, 197, 94)' },
    { bg: 'rgba(250, 204, 21, 0.2)', border: 'rgb(250, 204, 21)' },
    { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgb(239, 68, 68)' }
  ];

  // Prepare radar chart data for performance comparison
  const radarData = useMemo(() => {
    const maxRValue = Math.max(...assemblies.map(a => a.rValue));
    const maxCostEffectiveness = Math.max(...assemblies.map(a => a.costEffectiveness));
    const maxThickness = Math.max(...assemblies.map(a => a.thickness));

    return {
      labels: ['Thermal Resistance', 'Cost Efficiency', 'Compactness'],
      datasets: assemblies.map((assembly, index) => ({
        label: assembly.name,
        data: [
          (assembly.rValue / maxRValue) * 100, // Normalized R-value
          (assembly.costEffectiveness / maxCostEffectiveness) * 100, // Normalized cost effectiveness
          (1 - assembly.thickness / maxThickness) * 100 // Inverse thickness (lower is better)
        ],
        backgroundColor: colors[index % colors.length].bg,
        borderColor: colors[index % colors.length].border,
        borderWidth: 2,
        pointBackgroundColor: colors[index % colors.length].border,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: colors[index % colors.length].border
      }))
    };
  }, [assemblies, colors]);

  // Prepare bar chart data for cost breakdown
  const costBreakdown = useMemo(() => {
    return calculateCostBreakdown(wallAssemblies);
  }, [wallAssemblies]);

  const barData = useMemo(() => {
    const allMaterials = new Set<string>();
    costBreakdown.forEach(breakdown => {
      breakdown.materialCosts.forEach(mc => allMaterials.add(mc.material));
    });
    const materials = Array.from(allMaterials);

    const datasets = assemblies.map((assembly, index) => ({
      label: assembly.name,
      data: materials.map(material => {
        const breakdown = costBreakdown.find(b => b.assemblyId === assembly.assemblyId);
        const materialCost = breakdown?.materialCosts.find(mc => mc.material === material);
        return materialCost?.cost || 0;
      }),
      backgroundColor: colors[index % colors.length].border
    }));

    return {
      labels: materials,
      datasets
    };
  }, [costBreakdown, assemblies, colors]);

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          font: { size: 10 }
        },
        pointLabels: {
          font: { size: 12, weight: 'bold' as const }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 12 }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        ticks: {
          font: { size: 10 }
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cost ($/m²)',
          font: { size: 12, weight: 'bold' as const }
        },
        ticks: {
          font: { size: 10 }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            const total = context.chart._metasets[context.datasetIndex].total;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Radar Chart */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Performance Comparison</h3>
          <div className="flex gap-2">
            {assemblies.map((assembly, index) => (
              <Badge
                key={assembly.assemblyId}
                variant={index === bestPerformingIndex ? 'default' : 'secondary'}
                className="text-xs"
              >
                {assembly.name}
              </Badge>
            ))}
          </div>
        </div>
        <div className="h-[400px]">
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>

      {/* Cost Breakdown Bar Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Cost Breakdown by Material</h3>
        <div className="h-[300px]">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}

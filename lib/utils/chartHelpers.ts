/**
 * Chart Helper Utilities
 *
 * Common chart configurations and data formatting
 * for Chart.js visualizations.
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

/**
 * Chart data types
 */
export interface ChartDataPoint {
  position: number;
  value: number;
  label?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
  borderDash?: number[];
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  scales?: {
    x?: {
      title?: { display: boolean; text: string; color?: string; font?: { size: number; weight: string } };
      ticks?: { color?: string; maxRotation?: number; minRotation?: number };
      grid?: { color?: string };
    };
    y?: {
      type: string;
      display: boolean;
      position: string;
      title?: { display: boolean; text: string; color?: string; font?: { size: number; weight: string } };
      ticks?: { color?: string };
      grid?: { color?: string; drawOnChartArea?: boolean };
    };
    y1?: {
      type: string;
      display: boolean;
      position: string;
      title?: { display: boolean; text: string; color?: string; font?: { size: number; weight: string } };
      ticks?: { color?: string };
      grid?: { color?: string; drawOnChartArea?: boolean };
    };
  };
  plugins?: {
    legend?: {
      position: string;
      labels?: { usePointStyle: boolean; padding?: number };
    };
    tooltip?: {
      backgroundColor: string;
      titleColor: string;
      bodyColor: string;
      borderColor: string;
      borderWidth: number;
      padding: number;
      displayColors: boolean;
      usePointStyle: boolean;
    };
  };
}

/**
 * Chart color palette
 */
export const CHART_COLORS = {
  temperature: 'rgb(136, 132, 216)',
  vaporPressure: 'rgb(130, 202, 157)',
  saturationPressure: 'rgb(255, 115, 0)',
  dewPoint: 'rgb(255, 0, 0)',
  primary: 'rgb(59, 130, 246)',
  success: 'rgb(34, 197, 94)',
  warning: 'rgb(250, 204, 21)',
  danger: 'rgb(239, 68, 68)'
} as const;

/**
 * Register Chart.js components
 *
 * Call this once at application startup to ensure all components are available.
 */
export function registerChartComponents(): void {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );
}

/**
 * Get standard chart options
 *
 * @returns Base chart options object
 */
export function getBaseChartOptions(): ChartOptions {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: false, text: '', color: '' },
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(100, 116, 139, 0.3)' }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: false, text: '', color: '' },
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(100, 116, 139, 0.3)' }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        usePointStyle: true
      }
    }
  };
}

/**
 * Get options for dual-axis chart (temperature + pressure)
 *
 * @returns Chart options with dual Y-axes
 */
export function getDualAxisChartOptions(): ChartOptions {
  return {
    ...getBaseChartOptions(),
    scales: {
      x: {
        title: { display: true, text: 'Position (m)', color: '#64748b', font: { size: 14, weight: 'bold' as const } },
        ticks: { color: '#64748b', maxRotation: 45, minRotation: 45 },
        grid: { color: 'rgba(100, 116, 139, 0.3)' }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'Temperature (°C)', color: CHART_COLORS.temperature, font: { size: 14, weight: 'bold' as const } },
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(100, 116, 139, 0.3)' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: 'Pressure (Pa)', color: CHART_COLORS.vaporPressure, font: { size: 14, weight: 'bold' as const } },
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(100, 116, 139, 0.3)', drawOnChartArea: false }
      }
    }
  };
}

/**
 * Format chart tooltip callback
 *
 * @param includeMaterial - Whether to include material name
 * @returns Tooltip title formatter
 */
export function createTooltipFormatter(includeMaterial: boolean = true): (context: unknown) => string {
  return (tooltipItems: unknown) => {
    if (!Array.isArray(tooltipItems) || !tooltipItems.length) return '';

    const item = tooltipItems[0] as { dataIndex?: number; label?: string; chart?: { data?: { labels?: string[] } } };
    const dataIndex = item.dataIndex;

    if (includeMaterial && dataIndex !== undefined && item.chart?.data?.labels?.[dataIndex]) {
      return `Position: ${item.label}\nMaterial: ${item.chart.data.labels[dataIndex]}`;
    }

    return `Position: ${item.label}`;
  };
}

/**
 * Format chart label callback
 *
 * @param materials - Array of material names
 * @returns Label formatter
 */
export function createLabelFormatter(materials: string[]): (value: unknown, index: number) => string {
  return (value: unknown, index: number) => {
    const material = materials[index];
    return `${value}\n${material || ''}`;
  };
}

/**
 * Create dew point annotation
 *
 * @param dewPoint - Dew point temperature
 * @returns Annotation configuration for dew point line
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDewPointAnnotation(dewPoint: number): any {
  return {
    type: 'line' as const,
    yMin: dewPoint,
    yMax: dewPoint,
    borderColor: CHART_COLORS.dewPoint,
    borderWidth: 2,
    borderDash: [5, 5],
    label: {
      display: true,
      content: `Dew Point: ${dewPoint.toFixed(1)}°C`,
      position: 'end' as const,
      backgroundColor: 'rgba(255, 0, 0, 0.7)',
      color: '#fff',
      font: { size: 12, weight: 'bold' as const }
    }
  };
}

/**
 * Create dataset for temperature data
 *
 * @param temperatures - Array of temperature values
 * @returns Chart dataset object
 */
export function createTemperatureDataset(temperatures: number[]): ChartDataset {
  return {
    label: 'Temperature (°C)',
    data: temperatures,
    borderColor: CHART_COLORS.temperature,
    backgroundColor: 'rgba(136, 132, 216, 0.5)',
    fill: false,
    tension: 0.1,
    pointRadius: 4,
    pointHoverRadius: 6
  };
}

/**
 * Create dataset for vapor pressure data
 *
 * @param pressures - Array of vapor pressure values
 * @returns Chart dataset object
 */
export function createVaporPressureDataset(pressures: number[]): ChartDataset {
  return {
    label: 'Vapor Pressure (Pa)',
    data: pressures,
    borderColor: CHART_COLORS.vaporPressure,
    backgroundColor: 'rgba(130, 202, 157, 0.5)',
    fill: false,
    tension: 0.1,
    pointRadius: 4,
    pointHoverRadius: 6
  };
}

/**
 * Create dataset for saturation pressure data
 *
 * @param pressures - Array of saturation pressure values
 * @returns Chart dataset object
 */
export function createSaturationPressureDataset(pressures: number[]): ChartDataset {
  return {
    label: 'Saturation Pressure (Pa)',
    data: pressures,
    borderColor: CHART_COLORS.saturationPressure,
    backgroundColor: 'rgba(255, 115, 0, 0.5)',
    fill: false,
    tension: 0.1,
    pointRadius: 4,
    pointHoverRadius: 6
  };
}

/**
 * Create chart data object from arrays
 *
 * @param positions - X-axis positions
 * @param datasets - Array of datasets
 * @param materials - Material names for labels
 * @returns Chart.js data object
 */
export function createChartData(
  positions: number[],
  datasets: ChartDataset[],
  materials?: string[]
): ChartData {
  return {
    labels: materials || positions.map(p => p.toFixed(3)),
    datasets
  };
}

/**
 * Check if chart data is valid
 *
 * @param data - Chart data object
 * @returns True if data has valid arrays
 */
export function isValidChartData(data: ChartData): boolean {
  return (
    Array.isArray(data.labels) &&
    data.labels.length > 0 &&
    Array.isArray(data.datasets) &&
    data.datasets.length > 0 &&
    data.datasets.every(dataset => Array.isArray(dataset.data) && dataset.data.length > 0)
  );
}

/**
 * Get chart statistics
 *
 * @param data - Array of data values
 * @returns Statistics object
 */
export function getChartStatistics(data: number[]): {
  min: number;
  max: number;
  avg: number;
  range: number;
} {
  if (!data.length) {
    return { min: 0, max: 0, avg: 0, range: 0 };
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const avg = data.reduce((sum, val) => sum + val, 0) / data.length;

  return {
    min,
    max,
    avg,
    range: max - min
  };
}
/**
 * Assembly Comparison Calculations
 *
 * Functions for comparing multiple wall assemblies side-by-side
 * and calculating comparative metrics.
 */

import { WallComponent, StudWallType, ThermalPerformance, ExampleWall } from '../types/domain';
import { calculateTotalRValue, calculateUValue } from './rValue';
import { calculateThermalPerformance, calculateTotalCost } from './cost';

/**
 * Wall assembly definition for comparison
 * Extends ExampleWall with additional metadata
 */
export interface WallAssembly extends ExampleWall {
  /** Unique identifier */
  id: string;
  /** Optional description */
  description?: string;
  /** Thumbnail URL for preview */
  thumbnail?: string;
}

/**
 * Assembly metrics for comparison
 */
export interface AssemblyMetrics {
  /** Assembly ID */
  assemblyId: string;
  /** Assembly name */
  name: string;
  /** Total thermal resistance (m²K/W) */
  rValue: number;
  /** Overall thermal transmittance (W/m²K) */
  uValue: number;
  /** Total cost per square meter */
  cost: number;
  /** Total thickness in millimeters */
  thickness: number;
  /** Cost effectiveness (R-value per dollar) */
  costEffectiveness: number;
  /** Number of components */
  componentCount: number;
}

/**
 * Comparison result for multiple assemblies
 */
export interface ComparisonResult {
  /** Metrics for each assembly */
  assemblies: AssemblyMetrics[];
  /** Index of best performing assembly (lowest U-value) */
  bestPerformingIndex: number;
  /** Index of most cost-effective assembly */
  mostEfficientIndex: number;
  /** Index of thinnest assembly */
  thinnestIndex: number;
  /** Index of cheapest assembly */
  cheapestIndex: number;
  /** Weighted recommendation index */
  recommendedIndex: number;
}

/**
 * Comparison weights for recommendation
 */
export interface ComparisonWeights {
  /** Weight for R-value (0-1) */
  rValueWeight: number;
  /** Weight for cost (0-1) */
  costWeight: number;
  /** Weight for thickness (0-1) */
  thicknessWeight: number;
}

/**
 * Calculate metrics for a single wall assembly
 *
 * @param assembly - Wall assembly to analyze
 * @returns Assembly metrics
 */
export function calculateAssemblyMetrics(assembly: WallAssembly): AssemblyMetrics {
  const totalRValue = calculateTotalRValue(
    assembly.components,
    undefined,
    true
  );
  const uValue = calculateUValue(totalRValue);
  const cost = calculateTotalCost(assembly.components);
  const thickness = assembly.components.reduce(
    (sum, comp) => sum + comp.thickness,
    0
  );
  const costEffectiveness = cost > 0 ? totalRValue / cost : 0;

  return {
    assemblyId: assembly.id,
    name: assembly.name,
    rValue: totalRValue,
    uValue,
    cost,
    thickness,
    costEffectiveness,
    componentCount: assembly.components.length
  };
}

/**
 * Compare multiple wall assemblies
 *
 * @param assemblies - Array of wall assemblies to compare
 * @param weights - Optional custom weights for recommendation
 * @returns Comparison result with metrics and rankings
 *
 * @throws Error if fewer than 2 or more than 4 assemblies provided
 */
export function compareAssemblies(
  assemblies: WallAssembly[],
  weights?: Partial<ComparisonWeights>
): ComparisonResult {
  if (assemblies.length < 2) {
    throw new Error('At least 2 assemblies are required for comparison');
  }

  if (assemblies.length > 4) {
    throw new Error('Maximum 4 assemblies can be compared at once');
  }

  const defaultWeights: ComparisonWeights = {
    rValueWeight: 0.5,
    costWeight: 0.3,
    thicknessWeight: 0.2
  };

  const finalWeights = { ...defaultWeights, ...weights };

  const metrics = assemblies.map(calculateAssemblyMetrics);

  const bestPerformingIndex = metrics.findIndex(
    m => m.uValue === Math.min(...metrics.map(m => m.uValue))
  );
  const mostEfficientIndex = metrics.findIndex(
    m => m.costEffectiveness === Math.max(...metrics.map(m => m.costEffectiveness))
  );
  const thinnestIndex = metrics.findIndex(
    m => m.thickness === Math.min(...metrics.map(m => m.thickness))
  );
  const cheapestIndex = metrics.findIndex(
    m => m.cost === Math.min(...metrics.map(m => m.cost))
  );

  const recommendedIndex = calculateRecommendedAssembly(metrics, finalWeights);

  return {
    assemblies: metrics,
    bestPerformingIndex,
    mostEfficientIndex,
    thinnestIndex,
    cheapestIndex,
    recommendedIndex
  };
}

/**
 * Calculate recommended assembly based on weighted criteria
 *
 * @param metrics - Array of assembly metrics
 * @param weights - Weights for each criterion
 * @returns Index of recommended assembly
 */
function calculateRecommendedAssembly(
  metrics: AssemblyMetrics[],
  weights: ComparisonWeights
): number {
  const maxRValue = Math.max(...metrics.map(m => m.rValue));
  const maxCostEffectiveness = Math.max(...metrics.map(m => m.costEffectiveness));
  const maxThickness = Math.max(...metrics.map(m => m.thickness));

  const scores = metrics.map(m => {
    // Normalize metrics to 0-1 range
    const normalizedRValue = maxRValue > 0 ? m.rValue / maxRValue : 0;
    const normalizedCostEffectiveness = maxCostEffectiveness > 0
      ? m.costEffectiveness / maxCostEffectiveness
      : 0;
    const normalizedThickness = maxThickness > 0 ? 1 - (m.thickness / maxThickness) : 0; // Lower thickness is better

    // Calculate weighted score
    const score =
      (normalizedRValue * weights.rValueWeight) +
      (normalizedCostEffectiveness * weights.costWeight) +
      (normalizedThickness * weights.thicknessWeight);

    return score;
  });

  return scores.findIndex(s => s === Math.max(...scores));
}

/**
 * Calculate percentage difference between two assemblies
 *
 * @param metrics1 - First assembly metrics
 * @param metrics2 - Second assembly metrics
 * @returns Object with percentage differences for each metric
 */
export function calculatePercentageDifference(
  metrics1: AssemblyMetrics,
  metrics2: AssemblyMetrics
): {
  rValueDiff: number;
  uValueDiff: number;
  costDiff: number;
  thicknessDiff: number;
  costEffectivenessDiff: number;
} {
  const calculateDiff = (a: number, b: number): number => {
    if (a === 0) return b > 0 ? 100 : 0;
    return ((b - a) / a) * 100;
  };

  return {
    rValueDiff: calculateDiff(metrics1.rValue, metrics2.rValue),
    uValueDiff: calculateDiff(metrics1.uValue, metrics2.uValue),
    costDiff: calculateDiff(metrics1.cost, metrics2.cost),
    thicknessDiff: calculateDiff(metrics1.thickness, metrics2.thickness),
    costEffectivenessDiff: calculateDiff(metrics1.costEffectiveness, metrics2.costEffectiveness)
  };
}

/**
 * Get rank order for assemblies based on a metric
 *
 * @param metrics - Array of assembly metrics
 * @param metric - Metric to rank by
 * @returns Array of indices in rank order (best to worst)
 */
export function getRankOrder(
  metrics: AssemblyMetrics[],
  metric: keyof AssemblyMetrics
): number[] {
  return metrics
    .map((m, i) => ({ value: m[metric] as number, index: i }))
    .sort((a, b) => {
      const isCostRelated = metric === 'cost' || metric === 'uValue' || metric === 'thickness';
      return isCostRelated
        ? a.value - b.value  // Lower is better
        : b.value - a.value;  // Higher is better
    })
    .map(item => item.index);
}

/**
 * Validate that assemblies can be compared
 *
 * @param assemblies - Array of assemblies to validate
 * @returns True if valid, throws error otherwise
 */
export function validateAssemblies(assemblies: WallAssembly[]): boolean {
  if (assemblies.length < 2 || assemblies.length > 4) {
    throw new Error('Must have between 2 and 4 assemblies to compare');
  }

  for (const assembly of assemblies) {
    if (!assembly.id || !assembly.name) {
      throw new Error('Each assembly must have an id and name');
    }

    if (!assembly.components || assembly.components.length === 0) {
      throw new Error(`Assembly "${assembly.name}" must have at least one component`);
    }

    for (const component of assembly.components) {
      if (!component.material || component.thickness <= 0 || component.conductivity <= 0) {
        throw new Error(
          `Invalid component in assembly "${assembly.name}": material, thickness, and conductivity are required`
        );
      }
    }
  }

  return true;
}

/**
 * Calculate cost breakdown for comparison
 *
 * @param assemblies - Array of wall assemblies
 * @returns Cost breakdown by assembly with material breakdown
 */
export function calculateCostBreakdown(assemblies: WallAssembly[]): Array<{
  assemblyId: string;
  assemblyName: string;
  totalCost: number;
  materialCosts: Array<{
    material: string;
    cost: number;
    percentage: number;
  }>;
}> {
  return assemblies.map(assembly => {
    const materialCosts: Record<string, number> = {};
    let totalCost = 0;

    for (const component of assembly.components) {
      const cost = (component.thickness / 1000) * component.conductivity * 0.1; // Simplified cost calculation
      const material = component.material;

      if (materialCosts[material]) {
        materialCosts[material] += cost;
      } else {
        materialCosts[material] = cost;
      }

      totalCost += cost;
    }

    const materialCostArray = Object.entries(materialCosts).map(([material, cost]) => ({
      material,
      cost,
      percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0
    }));

    return {
      assemblyId: assembly.id,
      assemblyName: assembly.name,
      totalCost,
      materialCosts: materialCostArray.sort((a, b) => b.cost - a.cost)
    };
  });
}

/**
 * Calculate thermal performance summary
 *
 * @param metrics - Assembly metrics
 * @returns Performance summary object
 */
export function calculatePerformanceSummary(
  metrics: AssemblyMetrics
): {
  performance: 'excellent' | 'good' | 'fair' | 'poor';
  rating: number;
  strengths: string[];
  weaknesses: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Evaluate R-value
  if (metrics.rValue >= 4) {
    strengths.push('Excellent thermal resistance');
  } else if (metrics.rValue >= 3) {
    strengths.push('Good thermal resistance');
  } else if (metrics.rValue >= 2) {
    weaknesses.push('Moderate thermal resistance');
  } else {
    weaknesses.push('Low thermal resistance');
  }

  // Evaluate U-value
  if (metrics.uValue <= 0.25) {
    strengths.push('Low heat transfer');
  } else if (metrics.uValue <= 0.35) {
    strengths.push('Moderate heat transfer');
  } else {
    weaknesses.push('High heat transfer');
  }

  // Evaluate cost effectiveness
  if (metrics.costEffectiveness >= 0.01) {
    strengths.push('High cost effectiveness');
  } else if (metrics.costEffectiveness >= 0.005) {
    strengths.push('Moderate cost effectiveness');
  } else {
    weaknesses.push('Low cost effectiveness');
  }

  // Evaluate thickness
  if (metrics.thickness <= 200) {
    strengths.push('Compact design');
  } else if (metrics.thickness <= 300) {
    // Neutral
  } else {
    weaknesses.push('Thick assembly may impact floor area');
  }

  // Calculate overall rating (0-100)
  const rValueScore = Math.min(metrics.rValue / 5 * 40, 40); // Max 40 points
  const uValueScore = Math.max((0.5 - metrics.uValue) / 0.5 * 30, 0); // Max 30 points
  const costScore = Math.min(metrics.costEffectiveness / 0.01 * 30, 30); // Max 30 points

  const rating = Math.round(rValueScore + uValueScore + costScore);

  let performance: 'excellent' | 'good' | 'fair' | 'poor';
  if (rating >= 80) {
    performance = 'excellent';
  } else if (rating >= 60) {
    performance = 'good';
  } else if (rating >= 40) {
    performance = 'fair';
  } else {
    performance = 'poor';
  }

  return {
    performance,
    rating,
    strengths,
    weaknesses
  };
}

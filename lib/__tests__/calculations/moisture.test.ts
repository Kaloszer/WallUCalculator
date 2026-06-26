/**
 * Mould-risk assessment tests
 */

import { describe, it, expect } from 'vitest';
import {
  assessMouldRisk,
  type MonthlyMoistureAnalysis,
  type LayerMoistureData,
} from '../../calculations/moisture';

function layer(vaporPressure: number, saturationPressure: number, hasCondensation = false): LayerMoistureData {
  return { material: 'x', position: 0, temperature: 10, vaporPressure, saturationPressure, hasCondensation };
}

function month(index: number, layers: LayerMoistureData[]): MonthlyMoistureAnalysis {
  return {
    month: index,
    monthName: 'M',
    outdoorTemp: 5,
    outdoorRH: 80,
    indoorTemp: 20,
    indoorRH: 50,
    layerData: layers,
    totalAccumulation: 0,
    netMoistureFlow: 0,
  };
}

describe('assessMouldRisk', () => {
  it('reports low risk when all layers stay below 80% RH', () => {
    const data = [month(0, [layer(500, 1000), layer(600, 1000)])]; // 50%, 60%
    const result = assessMouldRisk(data);
    expect(result.level).toBe('low');
    expect(result.maxSurfaceRH).toBe(60);
    expect(result.monthsAtRisk).toBe(0);
  });

  it('reports elevated risk when a layer exceeds the 80% threshold (no condensation)', () => {
    const data = [
      month(0, [layer(500, 1000)]), // 50%
      month(1, [layer(880, 1000)]), // 88%
    ];
    const result = assessMouldRisk(data);
    expect(result.level).toBe('elevated');
    expect(result.maxSurfaceRH).toBe(88);
    expect(result.worstMonth).toBe(1);
    expect(result.monthsAtRisk).toBe(1);
  });

  it('reports high risk when condensation occurs at any layer', () => {
    const data = [month(0, [layer(950, 1000, true)])];
    const result = assessMouldRisk(data);
    expect(result.level).toBe('high');
  });

  it('caps reported surface RH at 100%', () => {
    const data = [month(0, [layer(1200, 1000)])]; // 120% → saturated
    const result = assessMouldRisk(data);
    expect(result.maxSurfaceRH).toBe(100);
    expect(result.level).toBe('high');
  });
});

/**
 * R-value Calculation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateComponentRValue,
  calculateTotalRValue,
  calculateUValue,
  calculateRValueContributions,
} from '../../calculations/rValue';
import { WallComponent, StudWallConfig } from '../../types/domain';
import { MM_TO_M } from '../../constants/calculations';

describe('R-value Calculations', () => {
  describe('calculateComponentRValue', () => {
    it('should calculate R-value for simple component', () => {
      const component: WallComponent = {
        id: 1,
        material: 'Brick',
        thickness: 102,
        conductivity: 1.7,
        isInsulation: false,
      };

      const result = calculateComponentRValue(component);
      const expected = (component.thickness * MM_TO_M) / component.conductivity;

      expect(result).toBeCloseTo(expected, 0.001);
    });

    it('should calculate R-value for stud layer using parallel path method', () => {
      const component: WallComponent = {
        id: 1,
        material: 'Insulation',
        thickness: 150,
        conductivity: 0.036,
        isInsulation: true,
        hasStuds: true,
      };

      const studConfig: StudWallConfig = {
        type: 'standard',
        studWidth: 45,
        studDepth: 150,
        studSpacing: 400,
        studConductivity: 0.12,
        studArea: 0.15,
      };

      const result = calculateComponentRValue(component, studConfig);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(5); // Should be reasonable
    });

    it('should return 0 for zero conductivity', () => {
      const component: WallComponent = {
        id: 1,
        material: 'Test',
        thickness: 100,
        conductivity: 0,
        isInsulation: false,
      };

      const result = calculateComponentRValue(component);
      expect(result).toBe(0);
    });
  });

  describe('calculateTotalRValue', () => {
    it('should sum R-values of all components', () => {
      const components: WallComponent[] = [
        {
          id: 1,
          material: 'Brick',
          thickness: 102,
          conductivity: 1.7,
          isInsulation: false,
        },
        {
          id: 2,
          material: 'Insulation',
          thickness: 50,
          conductivity: 0.036,
          isInsulation: true,
        },
      ];

      const result = calculateTotalRValue(components);
      expect(result).toBeGreaterThan(0);
    });

    it('should include air film resistance by default', () => {
      const components: WallComponent[] = [
        {
          id: 1,
          material: 'Brick',
          thickness: 102,
          conductivity: 1.7,
          isInsulation: false,
        },
      ];

      const result = calculateTotalRValue(components);
      const componentsR = components.reduce(
        (sum, comp) => sum + calculateComponentRValue(comp),
        0
      );
      expect(result).toBeCloseTo(componentsR + 0.17, 0.001);
    });

    it('should exclude air film resistance when requested', () => {
      const components: WallComponent[] = [
        {
          id: 1,
          material: 'Brick',
          thickness: 102,
          conductivity: 1.7,
          isInsulation: false,
        },
      ];

      const result = calculateTotalRValue(components, undefined, false);
      const componentsR = components.reduce(
        (sum, comp) => sum + calculateComponentRValue(comp),
        0
      );
      expect(result).toBeCloseTo(componentsR, 0.001);
    });
  });

  describe('calculateUValue', () => {
    it('should calculate U-value from R-value', () => {
      expect(calculateUValue(5)).toBeCloseTo(0.2, 0.001);
      expect(calculateUValue(10)).toBe(0.1);
    });

    it('should return 0 for zero R-value', () => {
      expect(calculateUValue(0)).toBe(0);
    });

    it('should handle negative R-value', () => {
      expect(calculateUValue(-5)).toBeCloseTo(-0.2, 0.001);
    });
  });

  describe('calculateRValueContributions', () => {
    it('should calculate percentage contributions', () => {
      const components: WallComponent[] = [
        {
          id: 1,
          material: 'Brick',
          thickness: 102,
          conductivity: 1.7,
          isInsulation: false,
        },
        {
          id: 2,
          material: 'Insulation',
          thickness: 50,
          conductivity: 0.036,
          isInsulation: true,
        },
      ];

      const contributions = calculateRValueContributions(components);
      expect(contributions).toHaveLength(2);
      expect(contributions[0] + contributions[1]).toBeCloseTo(100, 0.1);
    });

    it('should return zeros for zero total R', () => {
      const components: WallComponent[] = [
        {
          id: 1,
          material: 'Test',
          thickness: 100,
          conductivity: 0,
          isInsulation: false,
        },
      ];

      const contributions = calculateRValueContributions(components);
      contributions.forEach(c => expect(c).toBe(0));
    });
  });
});

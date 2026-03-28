/**
 * Calculator Component Types
 *
 * This file re-exports domain types and calculations from the lib/ layer
 * for backward compatibility with existing components.
 */

import type {
  WallComponent,
  Material,
  StudWallType,
  StudWallConfig,
  TemperatureDataPoint,
  VaporPressureDataPoint,
  CondensationRisk,
  DewPointResult,
  ThermalPerformance,
} from '../../../lib/types/domain';

import type { ExampleWall } from '../../../lib/types/domain';

export type { WallComponent, Material, StudWallType, StudWallConfig, TemperatureDataPoint, VaporPressureDataPoint, CondensationRisk, DewPointResult, ThermalPerformance };
export type { ExampleWall };

// Material property type (kept for backward compatibility)
export type MaterialProperty = number | string;

// Constants
export {
  MATERIALS as commonMaterials,
  getMaterialByName,
  getInsulationMaterials,
  getStructuralMaterials,
} from '../../../lib/constants/materials';

export {
  IJOIST_DEPTHS,
  STUD_WALL_CONFIGS as studWallConfigs,
  getStudConfig,
  hasStuds,
  getValidIJoistDepth,
} from '../../../lib/constants/studWalls';

export const MAX_LAYERS = 8;

// Calculation functions - re-export with legacy names for backward compatibility
export {
  calculateComponentRValue as calculateRValue,
  calculateTotalRValue,
  calculateUValue,
} from '../../../lib/calculations/rValue';

export {
  calculateDewPoint,
  calculateSaturationPressure,
  willCondensationOccur,
  getCondensationRiskLevel,
} from '../../../lib/calculations/dewPoint';

export {
  calculateTemperatures,
  calculateVaporPressureGradient,
  checkCondensationRisk,
  findDewPointPosition,
  getTemperatureDataPoints,
} from '../../../lib/calculations/temperatureGradient';

export {
  calculateComponentCost as calculateCost,
  calculateTotalCost,
  calculateCostEffectiveness,
  calculateInsulationROI as calculateROI,
} from '../../../lib/calculations/cost';

// Utility functions
export {
  getMaterialColor,
  isLightColor,
  getContrastTextColor,
  validateWallComponent,
  searchMaterials,
  groupMaterialsByType,
  sortMaterialsByConductivity,
  sortMaterialsByCostEffectiveness,
  formatThickness,
  formatConductivity,
  formatCost,
} from '../../../lib/utils/materialHelpers';

export {
  CHART_COLORS,
  getBaseChartOptions,
  getDualAxisChartOptions,
  createTooltipFormatter,
  createLabelFormatter,
  createDewPointAnnotation,
  createTemperatureDataset,
  createVaporPressureDataset,
  createSaturationPressureDataset,
  createChartData,
  isValidChartData,
  getChartStatistics,
  registerChartComponents,
} from '../../../lib/utils/chartHelpers';

// Example wall configurations
export const exampleWalls: ExampleWall[] = [
  {
    name: "Standard Stud Wall with Service Space",
    studWallType: "standard",
    components: [
      { material: "Gypsum Board", thickness: 12.5, conductivity: 0.2, isInsulation: false },
      { material: "Vapour Barrier", thickness: 1, conductivity: 0.4, isInsulation: false },
      { material: "Service Space", thickness: 50, conductivity: 0.036, isInsulation: true },
      { material: "Mineral Wool λ0.036", thickness: 150, conductivity: 0.036, isInsulation: true, hasStuds: true },
      { material: "Windbreak", thickness: 1, conductivity: 0.2, isInsulation: false },
      { material: "OSB", thickness: 12, conductivity: 0.13, isInsulation: false },
    ]
  },
  {
    name: "I-Joist Wall with Mineral Wool",
    studWallType: "i-joist",
    iJoistDepth: 200,
    components: [
      { material: "Gypsum Board", thickness: 12.5, conductivity: 0.2, isInsulation: false },
      { material: "Mineral Wool λ0.036", thickness: 200, conductivity: 0.036, isInsulation: true, hasStuds: true },
      { material: "Vapour Barrier", thickness: 1, conductivity: 0.4, isInsulation: false },
      { material: "OSB", thickness: 12, conductivity: 0.13, isInsulation: false },
      { material: "Plaster", thickness: 12, conductivity: 0.5, isInsulation: false },
    ]
  },
  {
    name: "Brick Wall with Mineral Wool",
    studWallType: "none",
    components: [
      { material: "Brick", thickness: 102, conductivity: 1.7, isInsulation: false },
      { material: "Mineral Wool λ0.036", thickness: 200, conductivity: 0.036, isInsulation: true },
      { material: "Brick", thickness: 102, conductivity: 1.7, isInsulation: false },
    ]
  }
];

// Legacy logger function (kept for backward compatibility)
export const logger = (component: string, action: string, data?: MaterialProperty) => {
  console.log(`[${component}] ${action}`, data ? data : '');
};

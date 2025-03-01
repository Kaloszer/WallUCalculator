export interface WallComponent {
  id: number
  material: string
  thickness: number
  conductivity: number
  isInsulation: boolean
  hasStuds?: boolean
  vaporResistance?: number;  // vapor resistance factor (μ)
}

export type MaterialProperty = number | string;

export interface Material {
  name: string
  conductivity: MaterialProperty
  color: string
  cost: number // Cost per m² per mm thickness
  isInsulation: boolean
  vaporResistance: number  // μ-value (vapor resistance factor)
}

export type StudWallType = 'none' | 'standard' | 'i-joist';

export interface StudWallConfig {
  type: StudWallType;
  studWidth: number;        // mm
  studDepth: number;        // mm
  studSpacing: number;     // mm (center to center)
  studConductivity: number; // W/mK
  studArea: number;        // percentage as decimal (0-1)
}

export const IJOIST_DEPTHS = [100, 150, 200, 250, 300, 350, 400];

export const studWallConfigs: Record<StudWallType, StudWallConfig> = {
  'none': {
    type: 'none',
    studWidth: 0,
    studDepth: 0,
    studSpacing: 0,
    studConductivity: 0,
    studArea: 0
  },
  'standard': {
    type: 'standard',
    studWidth: 45,      // 2x4 stud
    studDepth: 150,     // Standard depth
    studSpacing: 400,   // 16" on center
    studConductivity: 0.12, // Wood conductivity
    studArea: 0.15      // Approximately 15% of wall area
  },
  'i-joist': {
    type: 'i-joist',
    studWidth: 45,      // Flange width
    studDepth: 200,     // Default depth
    studSpacing: 600,   // 24" on center
    studConductivity: 0.13, // Composite conductivity
    studArea: 0.10      // Approximately 10% of wall area
  }
};

export const commonMaterials: Material[] = [
  { name: "Brick", conductivity: 1.7, color: "#BC4A3C", cost: 0.55, isInsulation: false, vaporResistance: 10 },
  { name: "Concrete", conductivity: 1.7, color: "#C4B6A6", cost: 150.0, isInsulation: false, vaporResistance: 100 },
  { name: "Gypsum Board", conductivity: 0.2, color: "#EEEDE4", cost: 2.5, isInsulation: false, vaporResistance: 8 },
  { name: "Mineral Wool λ0.036", conductivity: 0.036, color: "#D3D3D3", cost: 0.5, isInsulation: true, vaporResistance: 1 },
  { name: "Mineral Wool λ0.034", conductivity: 0.034, color: "#D3D3F3", cost: 1.0, isInsulation: true, vaporResistance: 1 },
  { name: "Insulation Foam", conductivity: 0.039, color: "#d0eae8", cost: 2.25, isInsulation: true, vaporResistance: 50 },
  { name: "Plywood", conductivity: 0.3, color: "#EED5AE", cost: 35.55, isInsulation: false, vaporResistance: 200 },
  { name: "OSB", conductivity: 0.13, color: "#DAA520", cost: 36.14, isInsulation: false, vaporResistance: 150 },
  { name: "Service Space", conductivity: 0.036, color: "#E8E8E8", cost: 0.5, isInsulation: true, vaporResistance: 1 },
  { name: "Windbreak", conductivity: 0.2, color: "#87CEEB", cost: 5.0, isInsulation: false, vaporResistance: 100 },
  { name: "Vapour Barrier", conductivity: 0.4, color: "#87CEEB", cost: 3.0, isInsulation: false, vaporResistance: 100000 },
  { name: "Plaster", conductivity: 0.5, color: "#f8f8ff", cost: 5.0, isInsulation: false, vaporResistance: 10 },
  // New Materials
  { name: "Glass", conductivity: 1.0, color: "#E0FFFF", cost: 10.0, isInsulation: false, vaporResistance: 1 },
  { name: "Steel", conductivity: 50.0, color: "#B0C4DE", cost: 500.0, isInsulation: false, vaporResistance: 1 },
  { name: "Aluminum", conductivity: 200.0, color: "#D3D3D3", cost: 600.0, isInsulation: false, vaporResistance: 1 },
  { name: "Vinyl", conductivity: 0.15, color: "#F0FFF0", cost: 5.0, isInsulation: false, vaporResistance: 1000 },
  { name: "Cellulose Insulation", conductivity: 0.04, color: "#F5DEB3", cost: 0.5, isInsulation: true, vaporResistance: 1 },
  { name: "Fiberglass", conductivity: 0.035, color: "#FFFFE0", cost: 0.6, isInsulation: true, vaporResistance: 1 },
  { name: "XPS Foam", conductivity: 0.03, color: "#87CEFA", cost: 2.0, isInsulation: true, vaporResistance: 100 },
  { name: "EPS Foam", conductivity: 0.03, color: "#B0E0E6", cost: 1.5, isInsulation: true, vaporResistance: 50 }
];

export const MAX_LAYERS = 8;

export interface ExampleWall {
  name: string;
  components: Omit<WallComponent, 'id'>[];
  studWallType: StudWallType;
  iJoistDepth?: number;
}

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

// Add utility functions that are used across components
export const calculateRValue = (component: WallComponent, studWallConfig?: StudWallConfig) => {
  if (component.hasStuds && studWallConfig && studWallConfig.type !== 'none') {
    // Calculate weighted R-value for stud layer using parallel path method
    const R_stud = (component.thickness / 1000) / studWallConfig.studConductivity;
    const R_insul = (component.thickness / 1000) / component.conductivity;
    const U_stud = 1 / R_stud;
    const U_insul = 1 / R_insul;
    const effective_U = (studWallConfig.studArea * U_stud) + ((1 - studWallConfig.studArea) * U_insul);
    return 1 / effective_U;
  } else {
    return component.conductivity > 0 ? (component.thickness / 1000) / component.conductivity : 0;
  }
};

export const calculateTotalRValue = (components: WallComponent[], studWallConfig?: StudWallConfig) => {
  return components.reduce(
    (sum, comp) => sum + calculateRValue(comp, comp.hasStuds ? studWallConfig : undefined), 
    0
  );
};

export const calculateUValue = (rValue: number) => {
  return rValue > 0 ? 1 / rValue : 0;
};

export const logger = (component: string, action: string, data?: MaterialProperty) => {
  console.log(`[${component}] ${action}`, data ? data : '');
};
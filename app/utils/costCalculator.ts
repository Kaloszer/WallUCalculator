// import { House } from "@/app/components/models/House";
// import { RoofAssembly, RoofAssemblyConfig } from "@/app/components/assemblies/roofAssembly";

// export function calculateWallCost(components: any[]): number {
//   // ...existing cost calculation for walls...
//   // Placeholder: sum thickness * cost factor (assumes each component has costPerMm)
//   return components.reduce((sum, comp) => sum + (comp.thickness * (comp.costPerMm || 1)), 0);
// }

// export function calculateHouseCost(components: any[], roofConfig: RoofAssemblyConfig, house: House): number {
//   const wallCost = calculateWallCost(components);
//   const roof = new RoofAssembly(roofConfig);
//   const roofCost = roof.getCost();
//   return wallCost + roofCost;
// }

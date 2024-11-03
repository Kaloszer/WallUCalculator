import { WallComponent, commonMaterials, logger } from "../types";

export const getComponentColor = (material: string) => {
  const materialInfo = commonMaterials.find(m => m.name === material);
  logger('visualization', 'Getting color for material', { material, color: materialInfo?.color });
  return materialInfo ? materialInfo.color : "#95a5a6";
};

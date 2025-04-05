import { commonMaterials, logger } from "../types";

export const getComponentColor = (material: string) => {
  const materialInfo = commonMaterials.find(m => m.name === material);
  logger('visualization', 'Getting color for material', materialInfo?.color);
  return materialInfo ? materialInfo.color : "#95a5a6";
};

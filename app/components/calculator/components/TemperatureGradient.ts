import { StudWallType, WallComponent, studWallConfigs, calculateRValue } from "@/app/components/calculator/types";

export function calculateTemperatures(
  components: WallComponent[], 
  insideTemp: number, 
  outsideTemp: number,
  studWallType: StudWallType = 'none'
): number[] {
  const studWallConfig = studWallConfigs[studWallType];
  const temperatures = [insideTemp];
  
  // Calculate total R-value considering studs
  let totalR = 0;
  for (const component of components) {
    const rValue = calculateRValue(component, component.hasStuds ? studWallConfig : undefined);
    totalR += rValue;
  }
  
  let currentR = 0;
  for (const component of components) {
    const rValue = calculateRValue(component, component.hasStuds ? studWallConfig : undefined);
    currentR += rValue;
    temperatures.push(insideTemp - (currentR / totalR) * (insideTemp - outsideTemp));
  }

  return temperatures;
}

export function calculateVaporPressureGradient(
  components: WallComponent[],
  insideTemp: number,
  outsideTemp: number,
  insideRH: number,
  outsideRH: number,
  studWallType: StudWallType = 'none'
): number[] {
  const temperatures = calculateTemperatures(components, insideTemp, outsideTemp, studWallType);
  const saturationPressures = temperatures.map((temp) => 610.7 * Math.pow(10, (7.5 * temp) / (237.3 + temp)));
  const totalResistance = components.reduce((sum, comp) => sum + (comp.vaporResistance || 1) * (comp.thickness / 1000), 0);
  const pInside = saturationPressures[0] * (insideRH / 100);
  const pOutside = saturationPressures[saturationPressures.length - 1] * (outsideRH / 100);
  const pressures = [pInside];
  let currentResistance = 0;

  for (const component of components) {
    const resistance = (component.vaporResistance || 1) * (component.thickness / 1000);
    currentResistance += resistance;
    pressures.push(pInside - (currentResistance / totalResistance) * (pInside - pOutside));
  }

  return pressures;
}

export function checkCondensationRisk(
  temperatures: number[],
  dewPoint: number,
  components: WallComponent[],
  insideRH: number = 50,
  outsideRH: number = 80,
  studWallType: StudWallType = 'none'
): { hasRisk: boolean; riskLayers: number[]; vaporPressureRisk: boolean; saturationPoints: number[] } {
  const riskLayers: number[] = [];
  const saturationPoints: number[] = [];
  const saturationPressures = temperatures.map((temp) => 610.7 * Math.pow(10, (7.5 * temp) / (237.3 + temp)));
  const actualPressures = calculateVaporPressureGradient(
    components, 
    temperatures[0], 
    temperatures[temperatures.length - 1], 
    insideRH, 
    outsideRH,
    studWallType
  );

  for (let i = 1; i < temperatures.length - 1; i++) {
    if (temperatures[i] <= dewPoint) riskLayers.push(i - 1);
    if (actualPressures[i] >= saturationPressures[i]) saturationPoints.push(i - 1);
  }

  return {
    hasRisk: riskLayers.length > 0,
    riskLayers,
    vaporPressureRisk: saturationPoints.length > 0,
    saturationPoints,
  };
}

export function findDewPointPosition(
  components: WallComponent[],
  insideTemp: number,
  outsideTemp: number,
  dewPoint: number,
  studWallType: StudWallType = 'none'
): number | null {
  const positions = [0];
  let totalThickness = 0;
  for (const component of components) {
    totalThickness += component.thickness / 1000;
    positions.push(totalThickness);
  }

  const temperatures = calculateTemperatures(components, insideTemp, outsideTemp, studWallType);
  
  // In a typical wall, temperature decreases from inside to outside
  // We only want to find where the temperature drops below the dew point
  for (let i = 0; i < temperatures.length - 1; i++) {
    const tStart = temperatures[i];
    const tEnd = temperatures[i + 1];
    
    // Only check for the case where temperature drops below dew point
    if (tStart > dewPoint && tEnd <= dewPoint) {
      const ratio = (tStart - dewPoint) / (tStart - tEnd);
      return positions[i] + ratio * (positions[i + 1] - positions[i]);
    }
  }

  // If we're still here, check if the entire wall is below dew point
  if (temperatures[0] <= dewPoint) {
    return 0; // Dew point occurs at the inside surface
  }
  
  // Or if dew point is never reached
  return null;
}
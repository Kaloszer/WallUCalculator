import { WallComponent } from "@/app/components/calculator/types";

export function calculateTemperatures(components: WallComponent[], insideTemp: number, outsideTemp: number): number[] {
  const temperatures = [insideTemp];
  const totalR = components.reduce(
    (sum, comp) => sum + (comp.thickness / 1000) / (comp.conductivity > 0 ? comp.conductivity : 1),
    0
  );
  let currentR = 0;

  for (const component of components) {
    const rValue = (component.thickness / 1000) / (component.conductivity > 0 ? component.conductivity : 1);
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
  outsideRH: number
): number[] {
  const temperatures = calculateTemperatures(components, insideTemp, outsideTemp);
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
  components: WallComponent[]
): { hasRisk: boolean; riskLayers: number[]; vaporPressureRisk: boolean; saturationPoints: number[] } {
  const riskLayers: number[] = [];
  const saturationPoints: number[] = [];
  const saturationPressures = temperatures.map((temp) => 610.7 * Math.pow(10, (7.5 * temp) / (237.3 + temp)));
  const actualPressures = calculateVaporPressureGradient(components, temperatures[0], temperatures[temperatures.length - 1], 50, 80);

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
  dewPoint: number
): number | null {
  const positions = [0];
  let totalThickness = 0;
  for (const component of components) {
    totalThickness += component.thickness / 1000;
    positions.push(totalThickness);
  }

  const temperatures = calculateTemperatures(components, insideTemp, outsideTemp);
  for (let i = 0; i < temperatures.length - 1; i++) {
    const tStart = temperatures[i];
    const tEnd = temperatures[i + 1];
    if ((tStart >= dewPoint && tEnd <= dewPoint) || (tStart <= dewPoint && tEnd >= dewPoint)) {
      const ratio = (tStart - dewPoint) / (tStart - tEnd);
      return positions[i] + ratio * (positions[i + 1] - positions[i]);
    }
  }

  return null;
}
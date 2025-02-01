import { WallComponent } from "@/app/components/calculator/types";

export class TemperatureGradient {
    calculateTemperatures(
        components: WallComponent[],
        insideTemp: number,
        outsideTemp: number
    ): number[] {
        // Replace error throw with a warning and default conductivity value.
        components.forEach(component => {
            if (component.conductivity <= 0) {
                console.warn(`Component with id ${component.id} has invalid conductivity. Using default conductivity value of 1.`);
            }
        });

        const temperatures: number[] = [insideTemp];
        const totalR = components.reduce((sum, comp) => 
            sum + (comp.thickness / 1000) / (comp.conductivity > 0 ? comp.conductivity : 1), 0);
        
        let currentTemp = insideTemp;
        let currentR = 0;

        components.forEach(component => {
            const rValue = (component.thickness / 1000) / (component.conductivity > 0 ? component.conductivity : 1);
            currentR += rValue;
            currentTemp = insideTemp - (currentR / totalR) * (insideTemp - outsideTemp);
            temperatures.push(currentTemp);
        });

        return temperatures;
    }

    calculateVaporPressureGradient(
        components: WallComponent[],
        insideTemp: number,
        outsideTemp: number,
        insideRH: number,
        outsideRH: number
    ): number[] {
        const temperatures = this.calculateTemperatures(components, insideTemp, outsideTemp);
        const pressures: number[] = [];
        
        // Calculate saturation vapor pressures at each temperature
        const saturationPressures = temperatures.map(temp => 
            610.7 * Math.pow(10, (7.5 * temp) / (237.3 + temp))
        );

        // Calculate actual vapor pressures considering material resistance
        const totalResistance = components.reduce((sum, comp) => 
            sum + ((comp.vaporResistance || 1) * comp.thickness / 1000), 0);
        
        const pInside = saturationPressures[0] * (insideRH / 100);
        const pOutside = saturationPressures[saturationPressures.length - 1] * (outsideRH / 100);
        
        pressures.push(pInside);
        
        let currentPressure = pInside;
        let currentResistance = 0;

        components.forEach((component, index) => {
            const resistance = (component.vaporResistance || 1) * component.thickness / 1000;
            currentResistance += resistance;
            currentPressure = pInside - (currentResistance / totalResistance) * (pInside - pOutside);
            pressures.push(currentPressure);
        });

        return pressures;
    }

    checkCondensationRisk(
        temperatures: number[],
        dewPoint: number,
        components: WallComponent[]
    ): { hasRisk: boolean; riskLayers: number[]; vaporPressureRisk: boolean; saturationPoints: number[] } {
        const riskLayers: number[] = [];
        const saturationPoints: number[] = [];
        let hasRisk = false;
        let vaporPressureRisk = false;

        // Calculate saturation vapor pressures
        const saturationPressures = temperatures.map(temp => 
            610.7 * Math.pow(10, (7.5 * temp) / (237.3 + temp))
        );

        const actualPressures = this.calculateVaporPressureGradient(
            components,
            temperatures[0],
            temperatures[temperatures.length - 1],
            50,
            80
        );

        // Skip first temperature (interior interface point)
        for (let i = 1; i < temperatures.length - 1; i++) {
            if (temperatures[i] <= dewPoint) {
                hasRisk = true;
                // Adjust index to match component array (subtract 1 because temperatures array includes interior point)
                riskLayers.push(i - 1);
            }

            if (actualPressures[i] >= saturationPressures[i]) {
                vaporPressureRisk = true;
                // Adjust index here as well
                saturationPoints.push(i - 1);
            }
        }

        return { hasRisk, riskLayers, vaporPressureRisk, saturationPoints };
    }

    findDewPointPosition(
        components: WallComponent[],
        insideTemp: number,
        outsideTemp: number,
        dewPoint: number
    ): number | null {
        // Calculate cumulative positions in meters
        const positions = [0];
        let totalThickness = 0;
        components.forEach(component => {
            totalThickness += component.thickness / 1000;
            positions.push(totalThickness);
        });
        
        // Calculate temperatures at boundaries
        const calculatedTemps = this.calculateTemperatures(components, insideTemp, outsideTemp);
        
        // Find segment where dewPoint is reached (assuming insideTemp > outsideTemp)
        for (let i = 0; i < calculatedTemps.length - 1; i++) {
            const tStart = calculatedTemps[i];
            const tEnd = calculatedTemps[i + 1];
            if ((tStart >= dewPoint && tEnd <= dewPoint) || (tStart <= dewPoint && tEnd >= dewPoint)) {
                const ratio = (tStart - dewPoint) / (tStart - tEnd);
                const dewPos = positions[i] + ratio * (positions[i + 1] - positions[i]);
                return dewPos;
            }
        }
        return null;
    }
}
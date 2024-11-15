import { WallComponent } from "@/app/components/calculator/types";

export class TemperatureGradient {
    calculateTemperatures(
        components: WallComponent[],
        insideTemp: number,
        outsideTemp: number
    ): number[] {
        const temperatures: number[] = [insideTemp];
        const totalR = components.reduce((sum, comp) => 
            sum + (comp.thickness / 1000) / comp.conductivity, 0);
        
        let currentTemp = insideTemp;
        let currentR = 0;

        components.forEach(component => {
            const rValue = (component.thickness / 1000) / component.conductivity;
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

        // Calculate actual vapor pressure gradient
        const actualPressures = this.calculateVaporPressureGradient(
            components,
            temperatures[0],
            temperatures[temperatures.length - 1],
            50, // Default RH inside
            80  // Default RH outside
        );

        temperatures.forEach((temp, index) => {
            if (temp <= dewPoint) {
                hasRisk = true;
                riskLayers.push(index);
            }

            // Check if actual vapor pressure exceeds saturation pressure
            if (actualPressures[index] >= saturationPressures[index]) {
                vaporPressureRisk = true;
                saturationPoints.push(index);
            }
        });

        return { hasRisk, riskLayers, vaporPressureRisk, saturationPoints };
    }
}
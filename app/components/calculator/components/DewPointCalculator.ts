export class DewPointCalculator {
    private validateInputs(temperature: number, humidity: number): void {
        if (temperature < -40 || temperature > 60) {
            throw new Error('Temperature must be between -40°C and 60°C');
        }
        if (humidity < 0.01 || humidity > 100) {
            throw new Error('Relative humidity must be between 0.01% and 100%');
        }
    }

    calculateDewPoint(temperature: number, humidity: number): number {
        this.validateInputs(temperature, humidity);
        
        // Magnus-Tetens formula constants
        const a = 17.27;
        const b = 237.7;

        // Calculate gamma
        const gamma = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100.0);

        // Calculate dew point
        const dewPoint = (b * gamma) / (a - gamma);
        
        return dewPoint;
    }
}
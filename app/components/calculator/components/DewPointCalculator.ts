export function calculateDewPoint(temperature: number, humidity: number): number {
    if (temperature < -40 || temperature > 60) {
      throw new Error("Temperature must be between -40°C and 60°C");
    }
    if (humidity < 0.01 || humidity > 100) {
      throw new Error("Relative humidity must be between 0.01% and 100%");
    }
  
    const a = 17.27;
    const b = 237.7;
    const gamma = (a * temperature) / (b + temperature) + Math.log(humidity / 100);
    return (b * gamma) / (a - gamma);
  }
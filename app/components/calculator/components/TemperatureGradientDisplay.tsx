import { WallComponent } from "../types";
import { Line } from "react-chartjs-2";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { TemperatureGradient } from "@/src/TemperatureGradient";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface Props {
    components: WallComponent[];
    insideTemp: number;
    outsideTemp: number;
    dewPoint: number;
    insideRH: number;
    outsideRH: number;
}

export function TemperatureGradientDisplay({
    components,
    insideTemp,
    outsideTemp,
    dewPoint,
    insideRH,
    outsideRH
}: Props) {
    const temperatureGradient = new TemperatureGradient();
    const temperatures = temperatureGradient.calculateTemperatures(
        components,
        insideTemp,
        outsideTemp
    );

    const vaporPressures = temperatureGradient.calculateVaporPressureGradient(
        components,
        insideTemp,
        outsideTemp,
        insideRH,
        outsideRH
    );

    const { hasRisk, riskLayers, vaporPressureRisk, saturationPoints } = 
        temperatureGradient.checkCondensationRisk(temperatures, dewPoint, components);

    // Enhanced chart configuration with vapor pressure
    const data = {
        labels: ['Interior', ...components.map(c => c.material)],
        datasets: [
            {
                label: 'Temperature',
                data: temperatures,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                yAxisID: 'y'
            },
            {
                label: 'Dew Point',
                data: Array(temperatures.length).fill(dewPoint),
                borderColor: 'rgb(255, 99, 132)',
                borderDash: [5, 5],
                yAxisID: 'y'
            },
            {
                label: 'Vapor Pressure',
                data: vaporPressures,
                borderColor: 'rgb(153, 102, 255)',
                tension: 0.1,
                yAxisID: 'y1'
            }
        ]
    };

    const options = {
        scales: {
            y: {
                type: 'linear' as const,
                position: 'left' as const,
                title: {
                    display: true,
                    text: 'Temperature (°C)'
                }
            },
            y1: {
                type: 'linear' as const,
                position: 'right' as const,
                title: {
                    display: true,
                    text: 'Vapor Pressure (Pa)'
                },
                grid: {
                    drawOnChartArea: false
                }
            }
        }
    };

    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Temperature and Vapor Pressure Gradients</h3>
            <div className="h-[300px]">
                <Line data={data} options={options} />
            </div>

            {(hasRisk || vaporPressureRisk) && (
                <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Condensation Risk Analysis</AlertTitle>
                    <AlertDescription>
                        {hasRisk && (
                            <div>
                                Temperature-based risk in layers: {riskLayers.map(i =>
                                    components[i]?.material || 'Interface'
                                ).join(', ')}
                            </div>
                        )}
                        {vaporPressureRisk && (
                            <div>
                                Vapor pressure exceeds saturation in layers: {saturationPoints.map(i =>
                                    components[i]?.material || 'Interface'
                                ).join(', ')}
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
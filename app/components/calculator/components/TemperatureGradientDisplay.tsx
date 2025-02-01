"use client";
import { useState, useEffect } from "react";
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

interface ChartData {
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            borderColor: string;
            tension?: number;
            yAxisID: string;
            borderDash?: number[];
        }[];
    };
    hasRisk: boolean;
    riskLayers: number[];
    vaporPressureRisk: boolean;
    saturationPoints: number[];
}

export function TemperatureGradientDisplay({
    components,
    insideTemp,
    outsideTemp,
    dewPoint,
    insideRH,
    outsideRH
}: Props) {
    const [chartData, setChartData] = useState<ChartData | null>(null);

    useEffect(() => {
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

        // Create dewPoint line data
        const dewPointLine = new Array(temperatures.length).fill(dewPoint);

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
                    label: 'Vapor Pressure',
                    data: vaporPressures,
                    borderColor: 'rgb(153, 102, 255)',
                    tension: 0.1,
                    yAxisID: 'y1'
                },
                {
                    label: 'Dew Point',
                    data: dewPointLine,
                    borderColor: 'rgb(255, 99, 132)',
                    borderDash: [5, 5],
                    tension: 0,
                    yAxisID: 'y'
                }
            ]
        };

        setChartData({
            data,
            hasRisk,
            riskLayers,
            vaporPressureRisk,
            saturationPoints
        });
    }, [components, insideTemp, outsideTemp, dewPoint, insideRH, outsideRH]);

    const options: {
        scales: {
            y: {
                type: 'linear';
                position: 'left';
                title: {
                    display: boolean;
                    text: string;
                };
            };
            y1: {
                type: 'linear';
                position: 'right';
                title: {
                    display: boolean;
                    text: string;
                };
                grid: {
                    drawOnChartArea: boolean;
                };
            };
        };
    } = {
        scales: {
            y: {
                type: 'linear',
                position: 'left',
                title: {
                    display: true,
                    text: 'Temperature (°C)'
                }
            },
            y1: {
                type: 'linear',
                position: 'right',
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

    if (!chartData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Temperature and Vapor Pressure Gradients</h3>
            <div className="h-[300px]">
                <Line data={chartData.data} options={options} />
            </div>

            {(chartData.hasRisk || chartData.vaporPressureRisk) && (
                <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Condensation Risk Analysis</AlertTitle>
                    <AlertDescription>
                        {chartData.hasRisk && (
                            <div>
                                Temperature-based risk in layers: {chartData.riskLayers.map(i =>
                                    components[i]?.material ?? "Unknown"
                                ).join(', ')}
                            </div>
                        )}
                        {chartData.vaporPressureRisk && (
                            <div>
                                Vapor pressure exceeds saturation in layers: {chartData.saturationPoints.map(i =>
                                    components[i]?.material ?? "Unknown"
                                ).join(', ')}
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
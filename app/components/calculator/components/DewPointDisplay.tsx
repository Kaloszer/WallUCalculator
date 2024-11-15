import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

interface DewPointDisplayProps {
    temperature: number;
    humidity: number;
    dewPoint: number;
    outsideTemp?: number;
    onTemperatureChange: (value: number) => void;
    onHumidityChange: (value: number) => void;
    onOutsideTempChange?: (value: number) => void;
}

export function DewPointDisplay({
    temperature,
    humidity,
    dewPoint,
    outsideTemp = 5,
    onTemperatureChange,
    onHumidityChange,
    onOutsideTempChange
}: DewPointDisplayProps) {
    const tempDiff = temperature - outsideTemp;
    const isExtremeDiff = tempDiff > 20 && humidity > 35;

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Analysis Conditions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                {isExtremeDiff && (
                    <Alert>
                        <InfoIcon className="h-4 w-4" />
                        <AlertDescription>
                            Note: You are analyzing a {tempDiff.toFixed(1)}°C temperature difference 
                            with {humidity}% RH. High indoor humidity with large temperature 
                            differences may require special consideration in the wall assembly 
                            to manage moisture effectively.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="grid gap-2">
                    <label>Inside Temperature: {temperature}°C</label>
                    <Slider
                        value={[temperature]}
                        onValueChange={([value]) => onTemperatureChange(value)}
                        min={-10}
                        max={40}
                        step={0.5}
                    />
                </div>
                <div className="grid gap-2">
                    <label>Outside Temperature: {outsideTemp}°C</label>
                    <Slider
                        value={[outsideTemp]}
                        onValueChange={([value]) => onOutsideTempChange?.(value)}
                        min={-20}
                        max={40}
                        step={0.5}
                    />
                </div>
                <div className="grid gap-2">
                    <label>Relative Humidity: {humidity}%</label>
                    <Slider
                        value={[humidity]}
                        onValueChange={([value]) => onHumidityChange(value)}
                        min={20}
                        max={60}
                        step={1}
                    />
                </div>
                <div className="text-lg font-semibold">
                    Dew Point: {dewPoint.toFixed(1)}°C
                </div>
            </CardContent>
        </Card>
    );
}
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StudWallType, IJOIST_DEPTHS } from "../types"
import { useWallCalculator } from "../context/WallCalculatorContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Ruler, Percent } from "lucide-react"

export function StudWallSelector() {
  const { 
    studWallType, 
    setStudWallType, 
    iJoistDepth, 
    setIJoistDepth,
    getStudConfig 
  } = useWallCalculator();

  return (
    <div className="mb-4">
      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Stud Wall Type
          </label>
          <Select
            value={studWallType}
            onValueChange={(value: StudWallType) => setStudWallType(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select stud wall type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Studs</SelectItem>
              <SelectItem value="standard">Standard Stud Wall</SelectItem>
              <SelectItem value="i-joist">I-Joist Wall</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {studWallType === 'i-joist' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              I-Joist Depth
            </label>
            <Select
              value={iJoistDepth.toString()}
              onValueChange={(value) => setIJoistDepth(Number(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select depth" />
              </SelectTrigger>
              <SelectContent>
                {IJOIST_DEPTHS.map((depth) => (
                  <SelectItem key={depth} value={depth.toString()}>
                    {depth}mm
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {studWallType !== 'none' && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Stud Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Depth: {getStudConfig().studDepth}mm</span>
              </div>
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Spacing: {getStudConfig().studSpacing}mm c/c</span>
              </div>
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Area Fraction: {(getStudConfig().studArea * 100).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
    </div>
  );
}
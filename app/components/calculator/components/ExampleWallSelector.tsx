
import { Button } from "@/components/ui/button"
import { exampleWalls } from "../types"
import { useWallCalculator } from "../context/WallCalculatorContext"

export function ExampleWallSelector() {
  const { loadExampleWall } = useWallCalculator();

  return (
    <div className="mb-4 space-x-2">
      <p className="text-sm text-gray-600 mb-2">Example Walls:</p>
      {exampleWalls.map((example) => (
        <Button
          key={example.name}
          variant="outline"
          onClick={() => loadExampleWall(example)}
        >
          {example.name}
        </Button>
      ))}
    </div>
  );
}
import { WallComponent, commonMaterials, StudWallConfig } from "./types"

interface WallVisualizationProps {
  components: WallComponent[];
  studWallConfig?: StudWallConfig;
}

const getComponentColor = (material: string) => {
  const materialInfo = commonMaterials.find(m => m.name === material)
  return materialInfo ? materialInfo.color : "#95a5a6"
}

// Remove the isInsulation function
// const isInsulation = (material: string) => material === "Mineral Wool";

const calculateRValue = (component: WallComponent) => {
  return component.conductivity > 0 ? (component.thickness / 1000) / component.conductivity : 0
}

const calculateCost = (component: WallComponent) => {
  const material = commonMaterials.find(m => m.name === component.material)
  return material ? material.cost * component.thickness : 0
}

const calculateCostEffectiveness = (component: WallComponent) => {
  const rValue = calculateRValue(component)
  const cost = calculateCost(component)
  return cost > 0 ? rValue / cost : 0
}

export function WallVisualization({ components, studWallConfig }: WallVisualizationProps) {
  const totalCost = components.reduce((sum, comp) => sum + calculateCost(comp), 0);
  const totalRValue = components.reduce((sum, comp) => sum + calculateRValue(comp), 0);
  const uValue = totalRValue > 0 ? 1 / totalRValue : 0;
  const averageCostEffectiveness = components.length > 0 
    ? components.reduce((sum, comp) => sum + calculateCostEffectiveness(comp), 0) / components.length
    : 0;

  return (
    <div className="mt-4">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <pattern id="insulation-pattern" patternUnits="userSpaceOnUse" width="15" height="15">
            <path
              d="M0 7.5 Q3.75 0, 7.5 7.5 Q11.25 15, 15 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
      </svg>

      <h2 className="text-xl font-semibold mb-2">Wall Visualization</h2>
      <div className="border rounded p-4">
        <div className="flex h-32">
          {components.map((component) => (
            <div
              key={component.id}
              style={{
                width: `${(component.thickness / components.reduce((sum, c) => sum + c.thickness, 0)) * 100}%`,
                backgroundColor: getComponentColor(component.material),
                position: 'relative',
              }}
              className="h-full relative"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-white">
                <span className="outlined-text">{component.material}</span>
                <span className="outlined-text">{component.thickness}mm</span>
                <span className="outlined-text text-[10px]">
                  R: {calculateRValue(component).toFixed(2)}
                </span>
                <span className="outlined-text text-[10px]">
                  ${calculateCost(component).toFixed(2)}/m²
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          {components.map((component) => (
            <div key={component.id} className="p-2 border rounded">
              <div className="font-semibold">{component.material}</div>
              <div>Thickness: {component.thickness}mm</div>
              <div>R-Value: {calculateRValue(component).toFixed(2)} m²K/W</div>
              <div>Cost: ${calculateCost(component).toFixed(2)}/m²</div>
              <div>Effectiveness: {calculateCostEffectiveness(component).toFixed(3)} m²K/W/$</div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 border rounded bg-gray-50 dark:bg-gray-800">
          <div className="font-bold text-lg mb-2">Wall Summary</div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="font-semibold">Total Cost</div>
              <div>${totalCost.toFixed(2)}/m²</div>
            </div>
            <div>
              <div className="font-semibold">Total R-Value</div>
              <div>{totalRValue.toFixed(2)} m²K/W</div>
            </div>
            <div>
              <div className="font-semibold">U-Value</div>
              <div>{uValue.toFixed(3)} W/m²K</div>
            </div>
            <div>
              <div className="font-semibold">Avg. Cost Effectiveness</div>
              <div>{averageCostEffectiveness.toFixed(3)} m²K/W/$</div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .outlined-text {
          text-shadow:
            -0.5px -0.5px 0 #000,
            0.5px -0.5px 0 #000,
            -0.5px 0.5px 0 #000,
            0.5px 0.5px 0 #000;
        }
      `}</style>
    </div>
  );
}

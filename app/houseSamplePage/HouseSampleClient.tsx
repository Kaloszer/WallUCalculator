"use client"
import { useSearchParams } from "next/navigation"
import { HouseVisualization } from "@/app/components/house-sample/HouseVisualization"
import { exampleWalls } from "@/app/components/calculator/types"

// Default to a realistic example assembly so the standalone demo route shows a
// complete house (walls + roof) when opened without a ?wallAssembly= payload.
const defaultWallAssembly = {
  components: exampleWalls[0].components.map((component, index) => ({ ...component, id: index })),
  studWallType: exampleWalls[0].studWallType,
}

export default function HouseSampleClient() {
  const searchParams = useSearchParams()
  let wallAssembly = defaultWallAssembly

  try {
    const wallAssemblyData = searchParams?.get("wallAssembly")
    if (wallAssemblyData) {
      wallAssembly = JSON.parse(wallAssemblyData)
    }
  } catch (error) {
    console.error("Error parsing wall assembly data:", error)
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">House Sample</h1>
      <HouseVisualization wallAssembly={wallAssembly} />
    </div>
  )
}

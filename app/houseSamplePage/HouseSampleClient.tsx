"use client"
import { useSearchParams } from "next/navigation"
import { HouseVisualization } from "@/app/components/house-sample/HouseVisualization"

export default function HouseSampleClient() {
  const searchParams = useSearchParams()
  let wallAssembly = {
    components: [],
    studWallType: "none"
  }

  try {
    if (searchParams) {
      const wallAssemblyData = searchParams.get("wallAssembly")
      if (wallAssemblyData) {
        wallAssembly = JSON.parse(wallAssemblyData)
      }
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

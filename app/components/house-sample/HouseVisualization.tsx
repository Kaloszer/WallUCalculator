"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { WallComponent } from "@/app/components/calculator/types";
import { useState } from "react";
import { WallSection } from "./components/WallSection";
import { RoofSection } from "./components/RoofSection";
import { 
  calculateRoofHeight,
  calculateGableWallHeight
} from "./utils/houseCalculations";

interface HouseVisualizationProps {
  wallAssembly: {
    components: WallComponent[];
    studWallType: string;
  };
}

export function HouseVisualization({ wallAssembly }: HouseVisualizationProps) {
  const [roofAngle, setRoofAngle] = useState(30);
  
  // House dimensions
  const width = 3;
  const depth = 3;
  const baseWallHeight = 3;
  const roofOverhang = 0.2;
  
  // Calculate derived values
  const roofHeight = calculateRoofHeight(roofAngle, width);
  const gableWallHeight = calculateGableWallHeight(baseWallHeight, roofHeight);
  const standardWallHeight = baseWallHeight;
  const totalThickness = wallAssembly.components.reduce(
    (sum, comp) => sum + comp.thickness, 0
  ) / 1000;

  return (
    <div className="w-full">
      <div className="mb-4">
        <label htmlFor="roofAngle" className="block text-sm font-medium mb-2">
          Roof Angle: {roofAngle}°
        </label>
        <input
          type="range"
          id="roofAngle"
          min="15"
          max="45"
          value={roofAngle}
          onChange={(e) => setRoofAngle(Number(e.target.value))}
          className="w-full"
        />
      </div>
      <div className="border rounded" style={{ height: "600px" }}>
        <Canvas camera={{ position: [8, 5, 8], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          {/* Front gable wall */}
          <WallSection
            position={[0, 0, depth / 2]}
            rotation={[0, Math.PI, 0]}
            size={[width, gableWallHeight, 0.2]}
            wallHeight={gableWallHeight}
            wallAssembly={wallAssembly}
            isGableWall={true}
            roofAngle={roofAngle}
            extraRoofWidth={width + roofOverhang * 2}
          />
          
          {/* Back gable wall */}
          <WallSection
            position={[0, 0, -depth / 2]}
            rotation={[0, 0, 0]}
            size={[width, gableWallHeight, 0.2]}
            wallHeight={gableWallHeight}
            wallAssembly={wallAssembly}
            isGableWall={true}
            roofAngle={roofAngle}
            extraRoofWidth={width + roofOverhang * 2}
          />
          
          {/* Left side wall */}
          <WallSection
            position={[-(width / 2 + totalThickness / 2), 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            size={[depth + totalThickness, standardWallHeight, 0.2]}
            wallHeight={standardWallHeight}
            wallAssembly={wallAssembly}
            roofAngle={roofAngle}
            extraRoofWidth={width + roofOverhang * 2}
          />
          
          {/* Right side wall */}
          <WallSection
            position={[width / 2 + totalThickness / 2, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            size={[depth + totalThickness, standardWallHeight, 0.2]}
            wallHeight={standardWallHeight}
            wallAssembly={wallAssembly}
            roofAngle={roofAngle}
            extraRoofWidth={width + roofOverhang * 2}
          />
          
          {/* Roof */}
          <RoofSection
            angle={roofAngle}
            position={[0, baseWallHeight, 0]}
            width={width + roofOverhang * 2}
            depth={depth + roofOverhang * 2}
          />
          
          {/* Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#90EE90" />
          </mesh>
          <gridHelper args={[10, 10]} />
          
          {/* Controls */}
          <OrbitControls
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2}
            enableZoom={true}
            enablePan={true}
          />
        </Canvas>
      </div>
    </div>
  );
}
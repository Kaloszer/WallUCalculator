"use client"
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { WallComponent } from '@/app/components/calculator/types'
import { useState, useMemo } from 'react'
import * as THREE from 'three'
import { getComponentColor } from '@/app/components/calculator/WallVisualization3D'
import { Geometry, Base, Subtraction } from '@react-three/csg'

interface HouseVisualizationProps {
  wallAssembly: {
    components: WallComponent[];
    studWallType: string;
  };
}

interface WallSectionProps {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
  wallHeight: number;
  wallAssembly: HouseVisualizationProps['wallAssembly'];
  isGableWall?: boolean;
  roofAngle?: number;
  extraRoofWidth?: number;
}

function WallSection({ position, rotation, size, wallAssembly, wallHeight, isGableWall = false, roofAngle, extraRoofWidth }: WallSectionProps) {
  const totalThickness = wallAssembly.components.reduce((sum, comp) => sum + comp.thickness, 0) / 1000
  const [width, height, depth] = size
  const adjustedWidth = width + (isGableWall ? 0 : -0.0001)

  const wallComponents = useMemo(() => {
    let currentPosition = 0
    return wallAssembly.components.map((component, index) => {
      const thickness = component.thickness / 1000
      const pos = currentPosition + thickness/2
      currentPosition += thickness

      if (isGableWall && roofAngle) {
        const angleRad = (roofAngle * Math.PI) / 180
        const roofHeight = Math.tan(angleRad) * (width / 2)
        const baseWallHeight = wallHeight - roofHeight
        const extendedWidth = extraRoofWidth ?? adjustedWidth

        return (
          <group key={index} position={[0, 0, pos - totalThickness/2]}>
            {/* Base rectangular wall */}
            <mesh position={[0, baseWallHeight/2, 0]}>
              <boxGeometry args={[adjustedWidth+width/7, baseWallHeight, thickness]} />
              <meshStandardMaterial
                color={getComponentColor(component.material)}
                transparent={component.isInsulation}
                opacity={component.isInsulation ? 0.7 : 1}
              />
            </mesh>
            {/* Triangular top */}
            <mesh position={[0, baseWallHeight, 0]}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={6}
                  array={new Float32Array([
                    -extendedWidth/2, 0, -thickness/2,
                    extendedWidth/2, 0, -thickness/2,
                    0, roofHeight, -thickness/2,  // Using roofHeight directly
                    -extendedWidth/2, 0, thickness/2,
                    extendedWidth/2, 0, thickness/2,
                    0, roofHeight, thickness/2,   // Using roofHeight directly
                  ])}
                  itemSize={3}
                />
                <bufferAttribute
                  attach="index"
                  count={12}
                  array={new Uint16Array([
                    0, 1, 2,     // Front face
                    3, 4, 5,     // Back face
                    0, 3, 4,  0, 4, 1, // Bottom
                    0, 2, 5,  0, 5, 3  // Sides
                  ])}
                  itemSize={1}
                />
              </bufferGeometry>
              <meshStandardMaterial
                color={getComponentColor(component.material)}
                transparent={component.isInsulation}
                opacity={component.isInsulation ? 0.7 : 1}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        )
      }

      // Non-gable wall: center the box at wallHeight/2 (bottom at 0)
      return (
        <mesh key={index} position={[0, wallHeight/2, pos - totalThickness/2]}>
          <boxGeometry args={[adjustedWidth, wallHeight, thickness]} />
          <meshStandardMaterial
            color={getComponentColor(component.material)}
            transparent={component.isInsulation}
            opacity={component.isInsulation ? 0.7 : 1}
          />
        </mesh>
      )
    })
  }, [wallAssembly.components, size, wallHeight, adjustedWidth, isGableWall, roofAngle, totalThickness, extraRoofWidth, width])  // Added width dependency

  return (
    <group position={position} rotation={rotation}>
      {wallComponents}
    </group>
  )
}

function RoofSection({ angle, position, width, depth }: {
  angle: number,
  position: [number, number, number],
  width: number,
  depth: number
}) {
  const angleRad = (angle * Math.PI) / 180
  const roofHeight = Math.tan(angleRad) * (width / 2)
  const hypotenuse = width / (2 * Math.cos(angleRad))

  return (
    <group position={position}>
      {/* Left roof panel */}
      <mesh rotation={[0, 0, angleRad]} position={[-width/4, roofHeight/2, 0]}>
        <boxGeometry args={[hypotenuse, 0.1, depth]} />
        <meshStandardMaterial color="saddlebrown" />
      </mesh>
      {/* Right roof panel */}
      <mesh rotation={[0, 0, -angleRad]} position={[width/4, roofHeight/2, 0]}>
        <boxGeometry args={[hypotenuse, 0.1, depth]} />
        <meshStandardMaterial color="saddlebrown" />
      </mesh>
    </group>
  )
}

export function HouseVisualization({ wallAssembly }: HouseVisualizationProps) {
  const [currentRoofAngle, setCurrentRoofAngle] = useState(30)
  const width = 3, depth = 3, baseWallHeight = 3, roofOverhang = 0.2
  const roofAngle = Math.min(45, Math.max(15, currentRoofAngle))
  const angleRad = (roofAngle * Math.PI) / 180
  const roofHeight = Math.tan(angleRad) * (width / 2)
  
  // Update this to include roofHeight
  const gableWallHeight = baseWallHeight + roofHeight
  const standardWallHeight = baseWallHeight
  const totalThickness = wallAssembly.components.reduce((sum, comp) => sum + comp.thickness, 0)/1000

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
          onChange={(e) => setCurrentRoofAngle(Number(e.target.value))}
          className="w-full"
        />
      </div>
      <div className="border rounded" style={{ height: '600px' }}>
        <Canvas camera={{ position: [8, 5, 8], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          {/* Front gable wall: rotated to fix inside-out orientation */}
          <WallSection
            position={[0, 0, depth/2]}
            rotation={[0, Math.PI, 0]}       // <-- rotation changed from [0, 0, 0]
            size={[width, gableWallHeight, 0.2]}
            wallHeight={gableWallHeight}
            wallAssembly={wallAssembly}
            isGableWall={true}
            roofAngle={roofAngle}
            extraRoofWidth={width + roofOverhang*2}
          />

          {/* Back gable wall: rotated to fix inside-out orientation */}
          <WallSection
            position={[0, 0, -depth/2]}
            rotation={[0, 0, 0]}               // <-- rotation changed from [0, Math.PI, 0]
            size={[width, gableWallHeight, 0.2]}
            wallHeight={gableWallHeight}
            wallAssembly={wallAssembly}
            isGableWall={true}
            roofAngle={roofAngle}
            extraRoofWidth={width + roofOverhang*2}
          />

          {/* Left wall */}
          <WallSection
            position={[-(width/2 + totalThickness/2), 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            size={[depth + totalThickness, standardWallHeight, 0.2]}
            wallHeight={standardWallHeight}
            wallAssembly={wallAssembly}
          />

          {/* Right wall */}
          <WallSection
            position={[width/2 + totalThickness/2, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            size={[depth + totalThickness, standardWallHeight, 0.2]}
            wallHeight={standardWallHeight}
            wallAssembly={wallAssembly}
          />

          {/* Roof stays unchanged */}
          <RoofSection
            angle={roofAngle}
            position={[0, baseWallHeight, 0]}
            width={width + roofOverhang*2}
            depth={depth + roofOverhang*2}
          />

          {/* Ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#90EE90" />
          </mesh>
          <gridHelper args={[10, 10]} />
          <OrbitControls
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2}
            enableZoom={true}
            enablePan={true}
          />
        </Canvas>
      </div>
    </div>
  )
}
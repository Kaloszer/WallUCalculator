'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Geometry, Base, Subtraction } from '@react-three/csg'
import { WallComponent, commonMaterials, StudWallConfig } from "./types"

interface WallVisualization3DProps {
  components: WallComponent[];
  studWallConfig?: StudWallConfig;
}

const getComponentColor = (material: string) => {
  const materialInfo = commonMaterials.find(m => m.name === material)
  return materialInfo ? materialInfo.color : "#95a5a6"
}

function Studs({ config, depth }: { config: StudWallConfig, depth: number }) {
  const studDepth = config.studDepth / 1000;
  const studWidth = config.studWidth / 1000;
  const woodColor = "#8B4513";
  const lightWoodColor = "#DEB887";

  // Always create exactly 3 studs
  const studPositions = [-0.5, 0, 0.5];  // left, middle, right positions

  const studs = studPositions.map((xPosition, i) => {
    if (config.type === 'i-joist') {
      const flangeWidth = 0.045;  // Width of flange
      const webThickness = 0.011; // Thickness of web
      const halfStudDepth = studDepth / 2;

      return (
        <group key={i}>
          {/* Left flange (vertical) */}
          <mesh position={[xPosition, 0, -halfStudDepth+(flangeWidth/2)]}>
            <boxGeometry args={[studWidth, 1, flangeWidth]} />
            <meshStandardMaterial color={woodColor} />
          </mesh>
          
          {/* Right flange (vertical) */}
          <mesh position={[xPosition, 0, halfStudDepth-(flangeWidth/2)]}>
            <boxGeometry args={[studWidth, 1, flangeWidth]} />
            <meshStandardMaterial color={woodColor} />
          </mesh>
          
          {/* Web (horizontal connecting piece) */}
          <mesh position={[xPosition, 0, 0]}>
            <boxGeometry args={[studWidth, 1, (studDepth - (2*flangeWidth))]} />
            <meshStandardMaterial color={lightWoodColor} />
          </mesh>
        </group>
      );
    } else {
      // Standard stud
      return (
        <mesh key={i} position={[xPosition, 0, 0]}>
          <boxGeometry args={[studWidth, 1, studDepth]} />
          <meshStandardMaterial color={woodColor} />
        </mesh>
      );
    }
  });

  return <>{studs}</>;
}

function StudVoids({ config, position }: { config: StudWallConfig, position: number }) {
  const studDepth = config.studDepth / 1000;
  const studWidth = config.studWidth / 1000;
  const studPositions = [-0.5, 0, 0.5];
  
  return studPositions.map((xPosition, i) => {
    if (config.type === 'i-joist') {
      const flangeWidth = 0.045;
      return (
        <group key={i} position={[xPosition, 0, 0]}>
          <Subtraction>
            <boxGeometry args={[studWidth, 1, studDepth]} />
          </Subtraction>
        </group>
      );
    }
    
    return (
      <Subtraction key={i} position={[xPosition, 0, 0]}>
        <boxGeometry args={[studWidth, 1, studDepth]} />
      </Subtraction>
    );
  });
}

function WallMesh({ components, studWallConfig }: { components: WallComponent[], studWallConfig?: StudWallConfig }) {
  const totalThickness = components.reduce((sum, comp) => sum + comp.thickness, 0)
  let currentPosition = -totalThickness / 2000

  return (
    <>
      {components.map((component, index) => {
        const isBarrier = component.material.toLowerCase().includes('barrier') || 
                         component.material.toLowerCase().includes('break');
        const visualThickness = component.thickness / 1000;
          
        
        const position = currentPosition + (component.thickness / 1000) / 2
        
        const shouldRenderStuds = component.hasStuds && 
                                 studWallConfig && 
                                 studWallConfig.type !== 'none';
        
        const result = (
          <group key={component.id} rotation={[0, Math.PI / 2, 0]}>
            {shouldRenderStuds ? (
              <mesh position={[0, 0, -position]}>
                <Geometry>
                  <Base>
                    <boxGeometry args={[1, 1, visualThickness]} />
                    <meshStandardMaterial 
                      color={getComponentColor(component.material)}
                      transparent={component.isInsulation || isBarrier}
                      opacity={isBarrier ? 0.9 : (component.isInsulation ? 0.7 : 1)}
                      roughness={isBarrier ? 0.4 : 0.8}
                      metalness={isBarrier ? 0.6 : 0.1}
                    />
                  </Base>
                  <StudVoids config={studWallConfig} position={position} />
                </Geometry>
              </mesh>
            ) : (
              <mesh position={[0, 0, -position]}>
                <boxGeometry args={[1, 1, visualThickness]} />
                <meshStandardMaterial 
                  color={getComponentColor(component.material)}
                  transparent={component.isInsulation || isBarrier}
                  opacity={isBarrier ? 0.9 : (component.isInsulation ? 0.7 : 1)}
                  roughness={isBarrier ? 0.4 : 0.8}
                  metalness={isBarrier ? 0.6 : 0.1}
                />
              </mesh>
            )}
            {shouldRenderStuds && studWallConfig && (
              <group position={[0, 0, -position]}>
                <Studs config={studWallConfig} depth={visualThickness} />
              </group>
            )}
          </group>
        )
        
        currentPosition += component.thickness / 1000
        return result
      })}
    </>
  )
}

export function WallVisualization3D({ components, studWallConfig }: WallVisualization3DProps) {
  const validatedConfig = studWallConfig && studWallConfig.type !== undefined 
    ? studWallConfig 
    : undefined;

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">3D Wall View</h2>
      <div className="border rounded p-4" style={{ height: '400px' }}>
        <Canvas camera={{ position: [0.5, 0.5, 1] }}>
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <WallMesh 
            components={components} 
            studWallConfig={validatedConfig} 
          />
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  )
}
"use client"

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Geometry, Base, Subtraction } from '@react-three/csg';
import { useSmoothScroll } from '../utils/smoothScroll';
import * as THREE from 'three';
import { WallComponent, ExampleWall, exampleWalls, StudWallConfig } from './calculator/types';
import { getComponentColor } from './calculator/utils/visualizationHelpers';

interface ExplodedWallViewProps {
  onNavigate?: () => void;
}

function AnimatedWallMesh({ 
  components, 
  studWallConfig, 
  mouseRotation,
  isCompressing,
  onCompressionComplete
}: { 
  components: WallComponent[], 
  studWallConfig?: StudWallConfig,
  mouseRotation: { x: number, y: number },
  isCompressing: boolean,
  onCompressionComplete: () => void
}) {
  const rootRef = useRef<THREE.Object3D>(null);
  const startTimeRef = useRef(0);
  const targetRotation = useRef([0.2, 0.3, 0]);

  useEffect(() => {
    if (isCompressing) {
      startTimeRef.current = Date.now();
    }
  }, [isCompressing]);

  // Update target rotation based on mouse position
  useEffect(() => {
    targetRotation.current = [
      0.2 + mouseRotation.y * Math.PI / 4,
      0.3 + mouseRotation.x * Math.PI / 4,
      0
    ];
  }, [mouseRotation.x, mouseRotation.y]);

  // Smoothly interpolate rotation in animation frame
  useFrame(() => {
    if (!rootRef.current) return;
    
    // Smoother animation with easing
    const easing = 0.08;
    rootRef.current.rotation.x += (targetRotation.current[0] - rootRef.current.rotation.x) * easing;
    rootRef.current.rotation.y += (targetRotation.current[1] - rootRef.current.rotation.y) * easing;
    rootRef.current.rotation.z += (targetRotation.current[2] - rootRef.current.rotation.z) * easing;
  });

  // Calculate the total thickness and center position
  const totalThickness = components.reduce((sum, comp) => sum + comp.thickness, 0) / 1000; // Convert to meters
  const centerY = totalThickness / 2;
  const spacing = 0.15; // Space between layers when exploded

  return (
    <group ref={rootRef}>
      {components.map((component, index) => {
        if (!component.thickness || !component.material) return null;

        // Calculate the layer's position in the assembled wall
        let layerPosition = -centerY;
        for (let i = 0; i < index; i++) {
          layerPosition += (components[i].thickness || 0) / 1000;
        }
        layerPosition += (component.thickness || 0) / 2000; // Add half of current layer thickness

        // When exploded, offset each layer by the spacing
        const explodedOffset = index * spacing;
        
        const yRef = useRef(layerPosition + explodedOffset);
        const lastYRef = useRef(yRef.current);
        const targetY = isCompressing ? layerPosition : layerPosition + explodedOffset;
        const isMovingRef = useRef(false);
        
        useFrame(() => {
          // Add delay for cascading effect during compression
          if (isCompressing && Date.now() - startTimeRef.current < index * 100) {
            return;
          }
          
          const ease = 0.08;
          const diff = targetY - yRef.current;
          const delta = diff * ease;
          
          // Check if we're still moving significantly
          if (Math.abs(diff) > 0.001) {
            yRef.current += delta;
            isMovingRef.current = true;
            lastYRef.current = yRef.current;
          } else if (isMovingRef.current) {
            // Snap to final position when movement is very small
            yRef.current = targetY;
            isMovingRef.current = false;
            
            // If this is the last layer and we've finished compressing, trigger completion
            if (isCompressing && index === components.length - 1) {
              onCompressionComplete();
            }
          }
        });
        const isBarrier = component.material.toLowerCase().includes('barrier') ||
          component.material.toLowerCase().includes('break');
        const visualThickness = component.thickness / 1000;

        const shouldRenderStuds = component.hasStuds &&
          studWallConfig &&
          studWallConfig.type !== 'none';

        const meshRef = useRef<THREE.Mesh>(null);


        return (
          <group key={component.id}>
            <group position-y={yRef.current}>
            {shouldRenderStuds ? (
              <mesh ref={meshRef} castShadow receiveShadow>
                  <Geometry>
                    <Base>
                      <boxGeometry args={[1, visualThickness, 1]} />
                      <meshStandardMaterial
                        color={getComponentColor(component.material)}
                        transparent={component.isInsulation || isBarrier}
                        opacity={isBarrier ? 0.9 : (component.isInsulation ? 0.7 : 1)}
                        roughness={isBarrier ? 0.4 : 0.8}
                        metalness={isBarrier ? 0.6 : 0.1}
                      />
                    </Base>
                    {studWallConfig && (
                      <Subtraction position={[0, 0, 0]}>
                        <boxGeometry args={[studWallConfig.studWidth / 1000, visualThickness, studWallConfig.studDepth / 1000]} />
                      </Subtraction>
                    )}
                  </Geometry>
              </mesh>
            ) : (
              <mesh ref={meshRef} castShadow receiveShadow>
                  <boxGeometry args={[1, visualThickness, 1]} />
                  <meshStandardMaterial
                    color={getComponentColor(component.material)}
                    transparent={component.isInsulation || isBarrier}
                    opacity={isBarrier ? 0.9 : (component.isInsulation ? 0.7 : 1)}
                    roughness={isBarrier ? 0.4 : 0.8}
                    metalness={isBarrier ? 0.6 : 0.1}
                  />
              </mesh>
            )}
            </group>
          </group>
        );
      })}
    </group>
  );
}

export function ExplodedWallView({ onNavigate }: ExplodedWallViewProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedWall] = useState<ExampleWall>(() => {
    const randomIndex = Math.floor(Math.random() * exampleWalls.length);
    return exampleWalls[randomIndex];
  });
  const [isCompressing, setIsCompressing] = useState(false);
  const smoothScroll = useSmoothScroll();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Convert mouse position to range -1 to 1
      const x = ((e.clientX / window.innerWidth) * 2 - 1) * 0.7;
      const y = (-(e.clientY / window.innerHeight) * 2 + 1) * 0.7;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleCompressionComplete = () => {
    if (onNavigate) {
      onNavigate();
    }
      smoothScroll('/calculator');
  };

  const handleClick = () => {
    setIsCompressing(true);
  };

  const components: WallComponent[] = selectedWall.components.map((comp, index) => ({
    ...comp,
    id: index
  }));

  return (
    <div className="relative w-full" style={{ height: '60vh' }}>
      <Canvas camera={{ position: [3, 2, 3], fov: 45 }} shadows>
        <ambientLight intensity={0.6} />
        <pointLight 
          position={[10, 10, 10]} 
          intensity={1.0}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight 
          position={[-10, -10, -10]} 
          intensity={0.4} 
        />
        <AnimatedWallMesh
          components={components}
          studWallConfig={selectedWall.studWallType !== 'none' ? {
            type: selectedWall.studWallType,
            studWidth: 45,
            studDepth: selectedWall.iJoistDepth || 150,
            studSpacing: selectedWall.studWallType === 'i-joist' ? 600 : 400,
            studConductivity: selectedWall.studWallType === 'i-joist' ? 0.13 : 0.12,
            studArea: selectedWall.studWallType === 'i-joist' ? 0.1 : 0.15
          } : undefined}
          mouseRotation={mousePosition}
          isCompressing={isCompressing}
          onCompressionComplete={handleCompressionComplete}
        />
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.5, 0]} 
          receiveShadow
        >
          <planeGeometry args={[10, 10]} />
          <shadowMaterial opacity={0.2} />
        </mesh>
        <OrbitControls enabled={false} />
      </Canvas>
      <button
        onClick={handleClick}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
      >
        Go to Calculator
      </button>
    </div>
  );
}

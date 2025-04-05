"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { WallComponent } from "@/app/components/calculator/types";
import { getComponentColor } from "@/app/components/calculator/utils/visualizationHelpers"; // Corrected import path

interface WallSectionProps {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
  wallHeight: number;
  wallAssembly: {
    components: WallComponent[];
    studWallType: string;
  };
  isGableWall?: boolean;
  roofAngle: number;
  extraRoofWidth: number;
}

export function WallSection({
  position,
  rotation,
  size,
  wallAssembly,
  wallHeight,
  isGableWall = false,
  roofAngle,
  extraRoofWidth,
}: WallSectionProps) {
  const totalThickness = wallAssembly.components.reduce((sum, comp) => sum + comp.thickness, 0) / 1000;
  const [width] = size;
  const adjustedWidth = width + (isGableWall ? 0 : -0.0001);

  // Calculate roof dimensions here to ensure consistency
  const angleRad = (roofAngle * Math.PI) / 180;
  const roofHeight = Math.tan(angleRad) * (width / 2);
  const extendedWidth = extraRoofWidth;

  // Calculate base wall height based on roof angle
  const baseWallHeight = wallHeight - roofHeight;

  const wallComponents = useMemo(() => {
    let currentPosition = 0;
    return wallAssembly.components.map((component) => {
      const thickness = component.thickness / 1000;
      const pos = currentPosition + thickness / 2;
      currentPosition += thickness;

      if (isGableWall) {
        // Create a triangle shape for each layer of the wall
        return (
          <group key={component.id} position={[0, 0, pos - totalThickness / 2]}>
            {/* Base rectangular wall */}
            <mesh position={[0, baseWallHeight / 2, 0]}>
              <boxGeometry args={[adjustedWidth + width / 7, baseWallHeight, thickness]} />
              <meshStandardMaterial
                color={getComponentColor(component.material)}
                transparent={component.isInsulation}
                opacity={component.isInsulation ? 0.7 : 1}
              />
            </mesh>
            
            {/* Triangular top - Using shape geometry for better precision */}
            <mesh position={[0, baseWallHeight, 0]}>
              {/* Create a proper triangular shape using ShapeGeometry */}
              <shapeGeometry args={[createTriangleShape(extendedWidth, roofHeight)]} />
              <meshStandardMaterial
                color={getComponentColor(component.material)}
                transparent={component.isInsulation}
                opacity={component.isInsulation ? 0.7 : 1}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      }

      // For non-gable walls
      return (
        <mesh key={component.id} position={[0, wallHeight / 2, pos - totalThickness / 2]}>
          <boxGeometry args={[adjustedWidth, wallHeight, thickness]} />
          <meshStandardMaterial
            color={getComponentColor(component.material)}
            transparent={component.isInsulation}
            opacity={component.isInsulation ? 0.7 : 1}
          />
        </mesh>
      );
    });
  }, [
    wallAssembly.components,
    wallHeight,
    isGableWall,
    totalThickness,
    width,
    adjustedWidth,
    baseWallHeight,
    extendedWidth,
    roofHeight
  ]);

  // Helper function to create a triangle shape
  function createTriangleShape(width: number, height: number) {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, height);
    shape.lineTo(-width / 2, 0);
    return shape;
  }

  return <group position={position} rotation={rotation}>{wallComponents}</group>;
}

"use client";

interface RoofSectionProps {
  angle: number;
  position: [number, number, number];
  width: number;
  depth: number;
}

export function RoofSection({
  angle,
  position,
  width,
  depth,
}: RoofSectionProps) {
  const angleRad = (angle * Math.PI) / 180;
  const roofHeight = Math.tan(angleRad) * (width / 2);
  const hypotenuse = width / (2 * Math.cos(angleRad));

  return (
    <group position={position}>
      <mesh rotation={[0, 0, angleRad]} position={[-width / 4, roofHeight / 2, 0]}>
        <boxGeometry args={[hypotenuse, 0.1, depth]} />
        <meshStandardMaterial color="saddlebrown" />
      </mesh>
      <mesh rotation={[0, 0, -angleRad]} position={[width / 4, roofHeight / 2, 0]}>
        <boxGeometry args={[hypotenuse, 0.1, depth]} />
        <meshStandardMaterial color="saddlebrown" />
      </mesh>
    </group>
  );
}
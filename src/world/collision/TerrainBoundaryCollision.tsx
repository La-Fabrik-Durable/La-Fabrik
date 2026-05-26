import { TERRAIN_BOUNDARY_CONFIG } from "@/data/world/terrainBoundaryConfig";

function createBoundarySegments(): React.JSX.Element[] {
  const segments: React.JSX.Element[] = [];
  const {
    center,
    height,
    radius,
    segments: segmentCount,
    thickness,
  } = TERRAIN_BOUNDARY_CONFIG;
  const arcLength = (Math.PI * 2 * radius) / segmentCount;

  for (let index = 0; index < segmentCount; index++) {
    const angle = (index / segmentCount) * Math.PI * 2;
    const x = center[0] + Math.cos(angle) * radius;
    const z = center[2] + Math.sin(angle) * radius;

    segments.push(
      <mesh key={index} position={[x, center[1], z]} rotation={[0, -angle, 0]}>
        <boxGeometry args={[arcLength, height, thickness]} />
        <meshBasicMaterial />
      </mesh>,
    );
  }

  return segments;
}

export function TerrainBoundaryCollision(): React.JSX.Element | null {
  if (!TERRAIN_BOUNDARY_CONFIG.enabled) {
    return null;
  }

  return <>{createBoundarySegments()}</>;
}

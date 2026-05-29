import { WORLD_BOUNDS_CONFIG } from "@/data/world/worldBoundsConfig";

export function WorldWallsCollision(): React.JSX.Element | null {
  if (!WORLD_BOUNDS_CONFIG.enabled) {
    return null;
  }

  const { center, size, wallHeight, wallThickness } = WORLD_BOUNDS_CONFIG;
  const [width, depth] = size;
  const wallY = center[1] + wallHeight / 2;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  return (
    <group name="world-walls-collision">
      <mesh position={[center[0], wallY, center[2] - halfDepth]}>
        <boxGeometry
          args={[width + wallThickness * 2, wallHeight, wallThickness]}
        />
        <meshBasicMaterial />
      </mesh>
      <mesh position={[center[0], wallY, center[2] + halfDepth]}>
        <boxGeometry
          args={[width + wallThickness * 2, wallHeight, wallThickness]}
        />
        <meshBasicMaterial />
      </mesh>
      <mesh position={[center[0] - halfWidth, wallY, center[2]]}>
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
        <meshBasicMaterial />
      </mesh>
      <mesh position={[center[0] + halfWidth, wallY, center[2]]}>
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

import { WORLD_BOUNDS_CONFIG } from "@/data/world/worldBoundsConfig";

export function WorldPlaneCollision(): React.JSX.Element | null {
  if (!WORLD_BOUNDS_CONFIG.enabled) {
    return null;
  }

  const { center, planeCollisionThickness, planeY, size } = WORLD_BOUNDS_CONFIG;
  const [width, depth] = size;

  return (
    <mesh
      name="world-plane-collision"
      position={[center[0], planeY - planeCollisionThickness / 2, center[2]]}
    >
      <boxGeometry args={[width, planeCollisionThickness, depth]} />
      <meshBasicMaterial />
    </mesh>
  );
}

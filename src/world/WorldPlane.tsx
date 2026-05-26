import { WORLD_BOUNDS_CONFIG } from "@/data/world/worldBoundsConfig";

export function WorldPlane(): React.JSX.Element | null {
  if (!WORLD_BOUNDS_CONFIG.enabled) {
    return null;
  }

  const { center, planeColor, planeY, size } = WORLD_BOUNDS_CONFIG;

  return (
    <mesh
      name="world-plane"
      position={[center[0], planeY, center[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={size} />
      <meshBasicMaterial color={planeColor} />
    </mesh>
  );
}

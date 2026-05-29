import { TERRAIN_COLORS } from "@/data/world/terrainConfig";
import type { Vector3Tuple } from "@/types/three/three";

export const WORLD_BOUNDS_CONFIG = {
  enabled: true,
  center: [0, 0, 0] as Vector3Tuple,
  planeColor: TERRAIN_COLORS.grass1.hex,
  planeY: -0.04,
  planeCollisionThickness: 1,
  size: [270, 260] as const,
  wallHeight: 28,
  wallThickness: 4,
};

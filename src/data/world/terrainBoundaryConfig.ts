import type { Vector3Tuple } from "@/types/three/three";

export const TERRAIN_BOUNDARY_CONFIG = {
  enabled: true,
  center: [-10, 8, -2] as Vector3Tuple,
  radius: 135,
  height: 28,
  thickness: 3,
  segments: 48,
};

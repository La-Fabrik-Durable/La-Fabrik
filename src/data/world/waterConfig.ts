import { TERRAIN_WATER_HEIGHT } from "@/data/world/terrainConfig";
import type { Vector3Tuple } from "@/types/three/three";

export interface WaterSurfaceConfig {
  position: Vector3Tuple;
  size: [number, number];
}

export const WATER_SHADER_CONFIG = {
  enabled: true,
  height: TERRAIN_WATER_HEIGHT,
  scale: 0.3,
  smoothness: 0.55,
  edgeThreshold: 0.067,
  edgeSoftness: 0.01,
  flowX: 0,
  flowZ: 0.05,
  cellSpeed: 0.3,
  noiseScale: 1.52,
  noiseFlowSpeed: 0.2,
  distortAmount: 0.3,
  deepColor: "#1a3a5c",
  midColor: "#59c0e8",
  midPos: 0.084,
  highlightColor: "#ffffff",
  opacity: 0.88,
  deepOpacity: 0.45,
};

export const WATER_SURFACES: WaterSurfaceConfig[] = [
  {
    position: [62, TERRAIN_WATER_HEIGHT, -82],
    size: [75, 42],
  },
];

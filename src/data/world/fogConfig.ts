import { TERRAIN_COLORS } from "@/data/world/terrainConfig";

export const FOG_CONFIG = {
  enabled: true,
  color: "#c8dbbe",
  near: 48,
  far: 78,
};

export const CHUNK_CONFIG = {
  enabled: true,
  chunkSize: 45,
  loadRadius: 60,
  unloadRadius: 75,
  updateInterval: 350,
};

export const GROUND_PLANE_COLOR = TERRAIN_COLORS.grass1.hex;

import { TERRAIN_COLORS } from "@/data/world/terrainConfig";

export const FOG_CONFIG = {
  enabled: true,
  color: "#c8dbbe",
  near: 22,
  far: 38,
};

export const CHUNK_CONFIG = {
  enabled: true,
  chunkSize: 30,
  loadRadius: 30,
  unloadRadius: 40,
  updateInterval: 350,
};

export const GROUND_PLANE_COLOR = TERRAIN_COLORS.grass1.hex;

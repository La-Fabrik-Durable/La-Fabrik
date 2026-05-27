export const GRASS_CONFIG = {
  enabled: true,
  patchSize: 30,
  bladeCount: 32000,
  bladeWidth: 0.08,
  maxBladeHeight: 0.36,
  randomHeightAmount: 0.25,
  surfaceOffset: 0.025,
  heightTextureSize: 128,
  windNoiseScale: 0.9,
  windStrength: 0.35,
  baldPatchModifier: 1.1,
  falloffSharpness: 0.35,
  heightNoiseFrequency: 9,
  heightNoiseAmplitude: 1,
  clumpFrequency: 2.6,
  clumpThreshold: 0.18,
  clumpSoftness: 0.45,
  maxBendAngle: 14,
} as const;

export const GRASS_COLORS = ["#84C66B", "#67B058", "#A3CA5B"] as const;

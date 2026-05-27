export const GRASS_CONFIG = {
  enabled: true,
  patchSize: 30,
  bladeCount: 18000,
  bladeWidth: 0.08,
  maxBladeHeight: 0.36,
  randomHeightAmount: 0.25,
  surfaceOffset: 0.025,
  heightTextureSize: 128,
  windNoiseScale: 0.9,
  baldPatchModifier: 2.5,
  falloffSharpness: 0.35,
  heightNoiseFrequency: 12,
  heightNoiseAmplitude: 3,
  maxBendAngle: 22,
} as const;

export const GRASS_COLORS = ["#84C66B", "#67B058", "#A3CA5B"] as const;

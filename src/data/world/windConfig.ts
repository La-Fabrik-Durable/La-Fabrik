export const WIND_DEFAULTS = {
  speed: 0.8,
  direction: 0.5584,
  strength: 1.5,
  noiseScale: 0.8,
};

export const WIND_BOUNDS = {
  speed: { min: 0, max: 2, step: 0.1 },
  direction: { min: -Math.PI, max: Math.PI, step: 0.1 },
  strength: { min: 0, max: 3, step: 0.1 },
  noiseScale: { min: 0.1, max: 5, step: 0.1 },
};

export type WindState = typeof WIND_DEFAULTS;

export function getWindVector(wind: WindState): { x: number; z: number } {
  const intensity = wind.speed * wind.strength;

  return {
    x: Math.cos(wind.direction) * intensity,
    z: Math.sin(wind.direction) * intensity,
  };
}

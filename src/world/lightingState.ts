import { LIGHTING_DEFAULTS } from "@/data/world/lightingConfig";

export interface LightingState {
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  sunX: number;
  sunY: number;
  sunZ: number;
}

export const LIGHTING_STATE: LightingState = { ...LIGHTING_DEFAULTS };

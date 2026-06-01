import type { Vector3Tuple } from "@/types/three/three";

export interface ZoneConfig {
  id: string;
  position: Vector3Tuple;
  radius: number;
  height: number;
  oneShot: boolean;
}

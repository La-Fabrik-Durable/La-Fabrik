import type { Vector3Tuple } from "@/types/three/three";

export interface CinematicCameraKeyframe {
  time: number;
  position: Vector3Tuple;
  target: Vector3Tuple;
}

export interface CinematicDefinition {
  id: string;
  timecode?: number;
  cameraKeyframes: CinematicCameraKeyframe[];
}

export interface CinematicManifest {
  version: 1;
  cinematics: CinematicDefinition[];
}

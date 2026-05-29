import type { Vector3Tuple } from "@/types/three/three";

export interface CameraTransform {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
}

export const EBIKE_CAMERA_TRANSFORM: CameraTransform = {
  position: [-3.5, 6, 0],
  rotation: [-10, -90, 0],
};

export const EBIKE_DROP_PLAYER_TRANSFORM: CameraTransform = {
  position: [0, 1.5, -3],
  rotation: [0, 0, 0],
};

import type { Vector3Scale, Vector3Tuple } from "@/types/three/three";

export function toVector3Scale(scale: Vector3Scale): Vector3Tuple {
  return typeof scale === "number" ? [scale, scale, scale] : scale;
}

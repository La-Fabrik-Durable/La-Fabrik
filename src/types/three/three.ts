import type { Octree } from "three-stdlib";
import type * as THREE from "three";

export type Vector3Tuple = [number, number, number];

export type Vector3Scale = Vector3Tuple | number;

export interface ModelTransformProps {
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Scale;
}

export type ColliderShape = "cuboid" | "ball" | "hull";

export type OctreeReadyHandler = (octree: Octree) => void;

/**
 * Keys for texture slots that may exist on various material types.
 */
export type TextureMaterialKey = Extract<
  | keyof THREE.MeshBasicMaterial
  | keyof THREE.MeshStandardMaterial
  | keyof THREE.MeshPhysicalMaterial
  | keyof THREE.MeshToonMaterial,
  string
>;

/**
 * Interface for materials that may have texture slots.
 * Used for type-safe texture diagnostic access and disposal.
 */
export type MaterialWithTextureSlots = THREE.Material &
  Partial<Record<TextureMaterialKey, THREE.Texture | null>>;

import * as THREE from "three";
import type {
  MaterialWithTextureSlots,
  TextureMaterialKey,
} from "@/types/three/three";

interface DisposeObject3DOptions {
  disposeTextures?: boolean;
}

/**
 * Common texture slot keys found on Three.js materials.
 * Exported for use in texture diagnostics and disposal.
 */
export const MATERIAL_TEXTURE_KEYS = [
  "alphaMap",
  "aoMap",
  "bumpMap",
  "clearcoatMap",
  "clearcoatNormalMap",
  "clearcoatRoughnessMap",
  "displacementMap",
  "emissiveMap",
  "envMap",
  "gradientMap",
  "lightMap",
  "map",
  "metalnessMap",
  "normalMap",
  "roughnessMap",
  "sheenColorMap",
  "sheenRoughnessMap",
  "specularColorMap",
  "specularIntensityMap",
  "specularMap",
  "thicknessMap",
  "transmissionMap",
] as const satisfies readonly TextureMaterialKey[];

export type { MaterialWithTextureSlots };

export function disposeObject3D(
  object: THREE.Object3D,
  options: DisposeObject3DOptions = {},
): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry?.dispose();

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => disposeMaterial(material, options));
    } else if (child.material) {
      disposeMaterial(child.material, options);
    }
  });
}

/**
 * Disposes only materials (not geometry) from an Object3D and its children.
 * Useful for cloned models where you want to preserve the original geometry.
 */
export function disposeModelMaterials(
  object: THREE.Object3D,
  options: DisposeObject3DOptions = {},
): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => disposeMaterial(material, options));
    } else if (child.material) {
      disposeMaterial(child.material, options);
    }
  });
}

function disposeMaterial(
  material: THREE.Material,
  options: DisposeObject3DOptions,
): void {
  material.dispose();
  if (!options.disposeTextures) return;

  const materialWithTextures = material as MaterialWithTextureSlots;

  for (const key of MATERIAL_TEXTURE_KEYS) {
    const value = materialWithTextures[key];

    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  }
}

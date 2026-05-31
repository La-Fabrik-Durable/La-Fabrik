import * as THREE from "three";
import type { Vector3Tuple } from "@/types/three/three";

export const LA_FABRIK_CENTER: Vector3Tuple = [59.4973, 6.2746, 64.6354];
export const LA_FABRIK_ROTATION_Y = 2.4107;
export const LA_FABRIK_HALF_EXTENTS = {
  x: 8.5,
  z: 7.5,
} as const;
export const LA_FABRIK_FLOOR_Y = 6.3;
export const LA_FABRIK_PLAYER_SPAWN: Vector3Tuple = [59.5, 8.05, 64.64];
export const LA_FABRIK_INTERIOR_LIGHT_POSITION: Vector3Tuple = [59.5, 9, 64.64];

const _terrainMatrix = new THREE.Matrix4();
const _meshWorldMatrix = new THREE.Matrix4();
const _inverseMeshWorldMatrix = new THREE.Matrix4();
const _worldPosition = new THREE.Vector3();

export function isInsideLaFabrikFootprint(
  x: number,
  z: number,
  padding = 0,
): boolean {
  const dx = x - LA_FABRIK_CENTER[0];
  const dz = z - LA_FABRIK_CENTER[2];
  const cos = Math.cos(-LA_FABRIK_ROTATION_Y);
  const sin = Math.sin(-LA_FABRIK_ROTATION_Y);
  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;

  return (
    Math.abs(localX) <= LA_FABRIK_HALF_EXTENTS.x + padding &&
    Math.abs(localZ) <= LA_FABRIK_HALF_EXTENTS.z + padding
  );
}

export function flattenLaFabrikTerrainFootprint(
  object: THREE.Object3D,
  position: Vector3Tuple,
  rotation: Vector3Tuple,
  scale: Vector3Tuple,
): void {
  _terrainMatrix.compose(
    new THREE.Vector3(...position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
    new THREE.Vector3(...scale),
  );
  object.updateMatrixWorld(true);

  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const geometry = child.geometry;
    const positions = geometry.getAttribute("position");
    if (!positions) return;

    _meshWorldMatrix.multiplyMatrices(_terrainMatrix, child.matrixWorld);
    _inverseMeshWorldMatrix.copy(_meshWorldMatrix).invert();

    for (let index = 0; index < positions.count; index++) {
      _worldPosition
        .fromBufferAttribute(positions, index)
        .applyMatrix4(_meshWorldMatrix);

      if (!isInsideLaFabrikFootprint(_worldPosition.x, _worldPosition.z, 0.8)) {
        continue;
      }

      _worldPosition.y = Math.min(_worldPosition.y, LA_FABRIK_FLOOR_Y - 0.35);
      _worldPosition.applyMatrix4(_inverseMeshWorldMatrix);
      positions.setXYZ(
        index,
        _worldPosition.x,
        _worldPosition.y,
        _worldPosition.z,
      );
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  });
}

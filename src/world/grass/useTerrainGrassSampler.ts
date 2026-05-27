import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { TERRAIN_MODEL_PATH } from "@/data/world/terrainConfig";
import type { TerrainSurfaceBounds } from "@/types/world/terrainSurface";
import type { Vector3Tuple } from "@/types/three/three";
import { getMapNodesByName } from "@/utils/map/loadMapSceneData";

const RAYCAST_Y = 500;
const RAYCAST_FAR = 1000;
const DOWN = new THREE.Vector3(0, -1, 0);
const DEFAULT_TERRAIN_POSITION: Vector3Tuple = [0, 0, 0];
const DEFAULT_TERRAIN_ROTATION: Vector3Tuple = [0, 0, 0];
const DEFAULT_TERRAIN_SCALE: Vector3Tuple = [1, 1, 1];

export interface TerrainGrassSample {
  normal: THREE.Vector3;
  position: THREE.Vector3;
}

export interface TerrainGrassSampler {
  bounds: TerrainSurfaceBounds;
  sample: (x: number, z: number) => TerrainGrassSample | null;
}

function createFallbackBounds(): TerrainSurfaceBounds {
  return {
    minX: -120,
    maxX: 120,
    minZ: -120,
    maxZ: 120,
  };
}

function createTerrainMatrix(
  position: Vector3Tuple,
  rotation: Vector3Tuple,
  scale: Vector3Tuple,
): THREE.Matrix4 {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
    new THREE.Vector3(...scale),
  );
}

function createTerrainGrassSampler(
  scene: THREE.Object3D,
  position: Vector3Tuple,
  rotation: Vector3Tuple,
  scale: Vector3Tuple,
): TerrainGrassSampler {
  const meshes: THREE.Mesh[] = [];
  const terrainMatrix = createTerrainMatrix(position, rotation, scale);
  const inverseTerrainMatrix = terrainMatrix.clone().invert();
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(terrainMatrix);
  const raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    DOWN,
    0,
    RAYCAST_FAR,
  );

  scene.updateMatrixWorld(true);
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child);
    }
  });

  const terrainBounds = new THREE.Box3().setFromObject(scene);
  if (!terrainBounds.isEmpty()) {
    terrainBounds.applyMatrix4(terrainMatrix);
  }

  const bounds = terrainBounds.isEmpty()
    ? createFallbackBounds()
    : {
        minX: terrainBounds.min.x,
        maxX: terrainBounds.max.x,
        minZ: terrainBounds.min.z,
        maxZ: terrainBounds.max.z,
      };

  return {
    bounds,
    sample: (x, z) => {
      const localOrigin = new THREE.Vector3(x, RAYCAST_Y, z).applyMatrix4(
        inverseTerrainMatrix,
      );
      const localDirection =
        DOWN.clone().transformDirection(inverseTerrainMatrix);

      raycaster.set(localOrigin, localDirection);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      if (!hit) return null;

      const normal = hit.face?.normal
        .clone()
        .transformDirection(hit.object.matrixWorld)
        .applyMatrix3(normalMatrix)
        .normalize();

      return {
        position: hit.point.clone().applyMatrix4(terrainMatrix),
        normal: normal ?? new THREE.Vector3(0, 1, 0),
      };
    },
  };
}

export function useTerrainGrassSampler(): TerrainGrassSampler {
  const { scene } = useGLTF(TERRAIN_MODEL_PATH);
  const terrainNode = getMapNodesByName("terrain")[0];
  const position = terrainNode?.position ?? DEFAULT_TERRAIN_POSITION;
  const rotation = terrainNode?.rotation ?? DEFAULT_TERRAIN_ROTATION;
  const scale = terrainNode?.scale ?? DEFAULT_TERRAIN_SCALE;

  return useMemo(
    () => createTerrainGrassSampler(scene, position, rotation, scale),
    [position, rotation, scale, scene],
  );
}

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { disposeObject3D } from "@/utils/three/dispose";

export function useClonedObject<T extends THREE.Object3D>(object: T): T {
  const clone = useMemo(() => object.clone(true) as T, [object]);

  useEffect(() => {
    return () => {
      disposeObject3D(clone);
    };
  }, [clone]);

  return clone;
}

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/map/blocking/model.glb";

type CenteredModel = {
  object: THREE.Object3D;
  scale: number;
};

function centerModel(model: THREE.Object3D): number {
  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());

  model.position.set(-center.x, -bounds.min.y, -center.z);

  return size.length() > 0 && size.length() < 10 ? 5 : 1;
}

export function Map(): React.JSX.Element {
  const { scene } = useGLTF(MODEL_PATH);
  const centeredModel = useMemo<CenteredModel>(() => {
    const object = scene.clone(true);
    const scale = centerModel(object);

    return { object, scale };
  }, [scene]);

  return (
    <group scale={centeredModel.scale}>
      <primitive object={centeredModel.object} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);

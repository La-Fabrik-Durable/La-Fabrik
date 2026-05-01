import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";

interface SkyModelProps {
  modelPath: string;
}

const SKY_MODEL_SCALE = 1;

export function SkyModel({ modelPath }: SkyModelProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useLoggedGLTF(modelPath, {
    scope: "SkyModel",
    scale: SKY_MODEL_SCALE,
  });
  const model = useClonedObject(scene);

  useFrame(() => {
    groupRef.current?.position.copy(camera.position);
  });

  return (
    <group ref={groupRef} scale={SKY_MODEL_SCALE} frustumCulled={false}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload("/models/sky/model.glb");

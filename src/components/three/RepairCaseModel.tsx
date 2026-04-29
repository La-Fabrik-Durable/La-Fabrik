import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Vector3Tuple } from "@/types/three";

interface RepairCaseModelProps {
  modelPath: string;
  open: boolean;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: number | Vector3Tuple;
}

const CASE_LID_NODE_NAME = "partiesup";
const CASE_OPEN_ANGLE = THREE.MathUtils.degToRad(115);
const CASE_OPEN_SPEED = 7;

export function RepairCaseModel({
  modelPath,
  open,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: RepairCaseModelProps): React.JSX.Element {
  const { scene } = useGLTF(modelPath);
  const model = useMemo(() => scene.clone(true), [scene]);
  const lidRef = useRef<THREE.Object3D | null>(null);
  const closedRotationX = useRef(0);
  const parsedScale =
    typeof scale === "number" ? ([scale, scale, scale] as Vector3Tuple) : scale;

  useEffect(() => {
    const lid = model.getObjectByName(CASE_LID_NODE_NAME);
    lidRef.current = lid ?? null;
    closedRotationX.current = lid?.rotation.x ?? 0;
  }, [model]);

  useFrame((_, delta) => {
    const lid = lidRef.current;
    if (!lid) return;

    const targetRotation =
      closedRotationX.current - (open ? CASE_OPEN_ANGLE : 0);
    lid.rotation.x = THREE.MathUtils.damp(
      lid.rotation.x,
      targetRotation,
      CASE_OPEN_SPEED,
      delta,
    );
  });

  return (
    <group position={position} rotation={rotation} scale={parsedScale}>
      <primitive object={model} />
    </group>
  );
}

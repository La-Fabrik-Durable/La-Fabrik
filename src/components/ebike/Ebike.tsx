import { useRef } from "react";
import * as THREE from "three";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { animateCameraTransition } from "@/world/GameCinematics";
import { useGameStore } from "@/managers/stores/useGameStore";
import type { Vector3Tuple } from "@/types/three/three";

const EBIKE_MODEL_PATH = "/models/ebike/model.gltf";
const EBIKE_CAMERA_POSITION: Vector3Tuple = [0, 1.5, -2];
const EBIKE_DROP_PLAYER_POSITION: Vector3Tuple = [2, 0, 0];

interface EbikeProps {
  position: Vector3Tuple;
}

export function Ebike({ position }: EbikeProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useLoggedGLTF(EBIKE_MODEL_PATH, {
    scope: "Ebike",
    position,
  });
  const model = useClonedObject(scene);
  const movementMode = useGameStore((state) => state.player.movementMode);

  const handleInteract = (): void => {
    if (movementMode === "walk") {
      const targetCamPos: Vector3Tuple = [
        position[0] + EBIKE_CAMERA_POSITION[0],
        position[1] + EBIKE_CAMERA_POSITION[1],
        position[2] + EBIKE_CAMERA_POSITION[2],
      ];
      const targetLookAt: Vector3Tuple = [
        position[0],
        position[1] + 1,
        position[2],
      ];

      animateCameraTransition(targetCamPos, targetLookAt, 1, () => {
        useGameStore.getState().setPlayerMovementMode("ebike");
      });
    } else {
      const targetCamPos: Vector3Tuple = [
        position[0] + EBIKE_DROP_PLAYER_POSITION[0],
        position[1] + EBIKE_DROP_PLAYER_POSITION[1],
        position[2] + EBIKE_DROP_PLAYER_POSITION[2],
      ];
      const targetLookAt: Vector3Tuple = [
        position[0],
        position[1] + 1,
        position[2],
      ];

      animateCameraTransition(targetCamPos, targetLookAt, 1, () => {
        useGameStore.getState().setPlayerMovementMode("walk");
      });
    }
  };

  return (
    <group ref={groupRef}>
      <primitive object={model} />
      <InteractableObject
        kind="trigger"
        label={
          movementMode === "walk" ? "Monter sur le bike" : "Descendre du bike"
        }
        position={position}
        radius={10}
        onPress={handleInteract}
      >
        <mesh>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="red" opacity={0.5} transparent />
        </mesh>
      </InteractableObject>
    </group>
  );
}

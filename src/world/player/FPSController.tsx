import { useEffect, useRef } from "react";
import { PointerLockControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PLAYER_EYE_HEIGHT = 1.75;
const PLAYER_SPAWN_POSITION = new THREE.Vector3(0, PLAYER_EYE_HEIGHT, 6);
const PLAYER_LOOK_AT = new THREE.Vector3(0, PLAYER_EYE_HEIGHT, 0);
const MOVE_SPEED = 5;

type PlayerKeys = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
};

const DEFAULT_KEYS: PlayerKeys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

export function FPSController(): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const keys = useRef<PlayerKeys>({ ...DEFAULT_KEYS });
  const interact = useRef<() => void>(() => {});
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const movement = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3(0, 1, 0));

  useEffect(() => {
    camera.position.copy(PLAYER_SPAWN_POSITION);
    camera.lookAt(PLAYER_LOOK_AT);
    camera.updateProjectionMatrix();

    return () => {
      document.exitPointerLock?.();
    };
  }, [camera]);

  useEffect(() => {
    const handleKeyChange =
      (pressed: boolean) =>
      (event: KeyboardEvent): void => {
        switch (event.code) {
          case "KeyZ":
            keys.current.forward = pressed;
            break;
          case "KeyS":
            keys.current.backward = pressed;
            break;
          case "KeyQ":
            keys.current.left = pressed;
            break;
          case "KeyD":
            keys.current.right = pressed;
            break;
          case "KeyE":
            if (pressed) {
              interact.current();
            }
            break;
          default:
            return;
        }

        event.preventDefault();
      };

    const handleKeyDown = handleKeyChange(true);
    const handleKeyUp = handleKeyChange(false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      keys.current = { ...DEFAULT_KEYS };
    };
  }, []);

  useFrame((_, delta) => {
    const currentForward = forward.current;
    const currentRight = right.current;
    const currentMovement = movement.current;

    currentMovement.set(0, 0, 0);

    camera.getWorldDirection(currentForward);
    currentForward.setY(0);

    if (currentForward.lengthSq() > 0) {
      currentForward.normalize();
      currentRight.crossVectors(currentForward, up.current).normalize();
    }

    if (keys.current.forward) {
      currentMovement.add(currentForward);
    }

    if (keys.current.backward) {
      currentMovement.sub(currentForward);
    }

    if (keys.current.left) {
      currentMovement.sub(currentRight);
    }

    if (keys.current.right) {
      currentMovement.add(currentRight);
    }

    if (currentMovement.lengthSq() > 0) {
      currentMovement.normalize().multiplyScalar(MOVE_SPEED * delta);
      camera.position.add(currentMovement);
    }

    if (camera.position.y < PLAYER_EYE_HEIGHT) {
      camera.position.set(
        camera.position.x,
        PLAYER_EYE_HEIGHT,
        camera.position.z,
      );
    }
  });

  return <PointerLockControls />;
}

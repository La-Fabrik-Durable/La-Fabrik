import { useEffect, useMemo, useRef } from "react";
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
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const movement = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

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
    movement.set(0, 0, 0);

    camera.getWorldDirection(forward);
    forward.y = 0;

    if (forward.lengthSq() > 0) {
      forward.normalize();
      right.crossVectors(forward, up).normalize();
    }

    if (keys.current.forward) {
      movement.add(forward);
    }

    if (keys.current.backward) {
      movement.sub(forward);
    }

    if (keys.current.left) {
      movement.sub(right);
    }

    if (keys.current.right) {
      movement.add(right);
    }

    if (movement.lengthSq() > 0) {
      movement.normalize().multiplyScalar(MOVE_SPEED * delta);
      camera.position.add(movement);
    }

    if (camera.position.y < PLAYER_EYE_HEIGHT) {
      camera.position.y = PLAYER_EYE_HEIGHT;
    }
  });

  return <PointerLockControls />;
}

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useGameStore } from "@/managers/stores/useGameStore";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";
import {
  PYLON_DOWNED_ROTATION,
  PYLON_NARRATIVE_INTERACT_RADIUS,
  PYLON_NARRATIVE_DIALOGUES,
  PYLON_STRAIGHTEN_ANIMATION_DURATION_MS,
  PYLON_UPRIGHT_ROTATION,
  PYLON_WORLD_POSITION,
} from "@/data/gameplay/pylonConfig";

const PYLON_MODEL_PATH = "/models/pylone/model.gltf";

export function PylonDownedPylon(): React.JSX.Element | null {
  const mainState = useGameStore((state) => state.mainState);
  const step = useGameStore((state) => state.pylon.currentStep);
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const setCanMove = useGameStore((state) => state.setCanMove);
  const [isStraightening, setIsStraightening] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const straightenStartRef = useRef<number | null>(null);

  const { scene } = useGLTF(PYLON_MODEL_PATH);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    if (!isStraightening || straightenStartRef.current === null) {
      const targetRotation =
        step === "narrator-outro"
          ? PYLON_UPRIGHT_ROTATION
          : PYLON_DOWNED_ROTATION;
      group.rotation.set(...targetRotation);
      return;
    }

    const elapsed = performance.now() - straightenStartRef.current;
    const t = Math.min(elapsed / PYLON_STRAIGHTEN_ANIMATION_DURATION_MS, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const startEuler = new THREE.Euler(...PYLON_DOWNED_ROTATION);

    group.rotation.set(
      THREE.MathUtils.lerp(startEuler.x, 0, eased),
      startEuler.y,
      THREE.MathUtils.lerp(startEuler.z, 0, eased),
    );
  });

  if (mainState !== "pylon") return null;

  if (
    step === "approaching" ||
    step === "waiting" ||
    step === "inspected" ||
    step === "fragmented" ||
    step === "scanning" ||
    step === "repairing" ||
    step === "reassembling" ||
    step === "done"
  ) {
    return null;
  }

  const isPylonInteractive = step === "arrived" || step === "npc-return";

  const beginStraighten = (): void => {
    setIsStraightening(true);
    straightenStartRef.current = performance.now();
    setCanMove(false);
    if (groupRef.current) {
      groupRef.current.rotation.set(...PYLON_DOWNED_ROTATION);
    }
    window.setTimeout(() => {
      setIsStraightening(false);
      setCanMove(true);
      setMissionStep("pylon", "waiting");
    }, PYLON_STRAIGHTEN_ANIMATION_DURATION_MS);
  };

  return (
    <group
      ref={groupRef}
      position={PYLON_WORLD_POSITION}
      rotation={PYLON_DOWNED_ROTATION}
    >
      <primitive object={scene.clone(true)} />
      {isPylonInteractive ? (
        <InteractableObject
          kind="trigger"
          label={
            step === "arrived" ? "Inspecter le pylône" : "Redresser le pylône"
          }
          position={PYLON_WORLD_POSITION}
          radius={PYLON_NARRATIVE_INTERACT_RADIUS}
          onPress={() => {
            if (step === "arrived") {
              void (async () => {
                const manifest = await loadDialogueManifest();
                if (!manifest) return;
                await playDialogueById(
                  manifest,
                  PYLON_NARRATIVE_DIALOGUES.brokenPylon,
                );
              })();
            } else if (step === "npc-return" && !isStraightening) {
              beginStraighten();
            }
          }}
        >
          <mesh>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </InteractableObject>
      ) : null}
    </group>
  );
}

useGLTF.preload(PYLON_MODEL_PATH);

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useGameStore } from "@/managers/stores/useGameStore";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";
import {
  PYLON_FARMER_NPC_AFTER_POSITION,
  PYLON_FARMER_NPC_POSITION,
  PYLON_NARRATIVE_DIALOGUES,
  PYLON_NARRATIVE_INTERACT_RADIUS,
} from "@/data/gameplay/pylonConfig";

export function PylonFarmerNPC(): React.JSX.Element | null {
  const mainState = useGameStore((state) => state.mainState);
  const step = useGameStore((state) => state.pylon.currentStep);
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const setCanMove = useGameStore((state) => state.setCanMove);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (mainState !== "pylon" || step !== "arrived") return;

    if (!groupRef.current) return;
    (groupRef.current.userData as Record<string, unknown>).startTime =
      undefined;
  }, [mainState, step]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    if (
      step === "npc-return" ||
      step === "waiting" ||
      step === "narrator-outro"
    ) {
      const startTime = (group.userData as Record<string, unknown>)
        .startTime as number | undefined;
      if (startTime === undefined) {
        (group.userData as Record<string, unknown>).startTime =
          performance.now();
        group.position.set(...PYLON_FARMER_NPC_AFTER_POSITION);
        return;
      }
      group.position.set(...PYLON_FARMER_NPC_AFTER_POSITION);
    } else {
      group.position.set(...PYLON_FARMER_NPC_POSITION);
    }
  });

  if (mainState !== "pylon") return null;
  if (step !== "arrived") return null;

  return (
    <group ref={groupRef} position={PYLON_FARMER_NPC_POSITION}>
      <mesh position={[0, 1, 0]}>
        <capsuleGeometry args={[0.4, 1.2, 6, 12]} />
        <meshStandardMaterial color="#a16207" />
      </mesh>
      <mesh position={[0, 1.95, 0]}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
      <InteractableObject
        kind="trigger"
        label="Parler au fermier"
        position={PYLON_FARMER_NPC_POSITION}
        radius={PYLON_NARRATIVE_INTERACT_RADIUS}
        onPress={() => {
          setCanMove(false);
          void (async () => {
            const manifest = await loadDialogueManifest();
            if (!manifest) {
              setCanMove(true);
              setMissionStep("pylon", "npc-return");
              return;
            }
            const audio = await playDialogueById(
              manifest,
              PYLON_NARRATIVE_DIALOGUES.farmerHelp,
            );
            if (!audio) {
              setCanMove(true);
              setMissionStep("pylon", "npc-return");
              return;
            }
            audio.addEventListener(
              "ended",
              () => {
                setCanMove(true);
                setMissionStep("pylon", "npc-return");
              },
              { once: true },
            );
          })();
        }}
      >
        <mesh>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </InteractableObject>
    </group>
  );
}

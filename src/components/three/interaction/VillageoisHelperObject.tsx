import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useMissionFlowStore } from "@/managers/stores/useMissionFlowStore";
import { Debug } from "@/utils/debug/Debug";
import type { Vector3Tuple } from "@/types/three/three";

interface VillageoisHelperObjectProps {
  position: Vector3Tuple;
}

export function VillageoisHelperObject({
  position,
}: VillageoisHelperObjectProps): React.JSX.Element {
  const step = useMissionFlowStore((state) => state.step);
  const setStep = useMissionFlowStore((state) => state.setStep);
  const debug = Debug.getInstance();

  const handlePress = (): void => {
    console.log("[VillageoisHelper] handlePress called, current step:", step);
    if (step === "searching") {
      console.log("[VillageoisHelper] Transitioning to helped");
      setStep("helped");
    }
  };

  const shouldShow = step === "searching" || debug.active;

  if (!shouldShow) {
    return <></>;
  }

  console.log(
    "[VillageoisHelper] Rendering, step:",
    step,
    "position:",
    position,
  );

  return (
    <InteractableObject
      kind="trigger"
      label="villageois_helper"
      position={position}
      onPress={handlePress}
    >
      <group position={position}>
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="cyan" />
        </mesh>
      </group>
    </InteractableObject>
  );
}

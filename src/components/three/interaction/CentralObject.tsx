import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useMissionFlowStore } from "@/managers/stores/useMissionFlowStore";
import { Debug } from "@/utils/debug/Debug";
import type { Vector3Tuple } from "@/types/three/three";

interface CentralObjectProps {
  position: Vector3Tuple;
}

export function CentralObject({
  position,
}: CentralObjectProps): React.JSX.Element {
  const step = useMissionFlowStore((state) => state.step);
  const setStep = useMissionFlowStore((state) => state.setStep);
  const setCanMove = useMissionFlowStore((state) => state.setCanMove);
  const showDialog = useMissionFlowStore((state) => state.showDialog);
  const debug = Debug.getInstance();

  const handlePress = (): void => {
    console.log("[CentralObject] handlePress called, current step:", step);

    if (step === "helped") {
      console.log("[CentralObject] Transitioning to manipulation");
      setCanMove(false);
      setStep("manipulation");
    } else if (step === "searching") {
      console.log("[CentralObject] Showing help message");
      showDialog(
        "Cet objet est trop lourd pour le porter tout seul, trouve de l'aide",
      );
    } else {
      console.log("[CentralObject] Step is not helped or searching, skipping");
    }
  };

  const shouldShow =
    step === "helped" || step === "manipulation" || debug.active;

  if (!shouldShow) {
    return <></>;
  }

  console.log("[CentralObject] Rendering, step:", step, "position:", position);

  return (
    <InteractableObject
      kind="trigger"
      label="central"
      position={position}
      onPress={handlePress}
    >
      <group position={position}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      </group>
    </InteractableObject>
  );
}

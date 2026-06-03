import { TriggerObject } from "@/components/three/interaction/TriggerObject";
import { REPAIR_INTERACTION_RADIUS } from "@/data/gameplay/repairGameConfig";
import type { Vector3Tuple } from "@/types/three/three";

interface RepairEbikeRepairTriggerProps {
  onRepair: () => void;
}

const TRIGGER_POSITION: Vector3Tuple = [0, 1.4, 0];

/**
 * Minimal interactable used for the ebike `repairing` step. Replaces
 * the heavier RepairRepairingStep (grabbable parts + placeholder
 * circles) with a single "Changez le refroidisseur" prompt. The
 * collider is invisible — the player just walks up and presses E.
 */
export function RepairEbikeRepairTrigger({
  onRepair,
}: RepairEbikeRepairTriggerProps): React.JSX.Element {
  return (
    <TriggerObject
      position={TRIGGER_POSITION}
      colliders="ball"
      label="Changez le refroidisseur"
      radius={REPAIR_INTERACTION_RADIUS}
      onTrigger={onRepair}
    >
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </TriggerObject>
  );
}

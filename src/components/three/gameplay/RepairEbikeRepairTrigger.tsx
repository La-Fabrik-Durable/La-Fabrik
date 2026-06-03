import { useState } from "react";
import { GrabbableObject } from "@/components/three/interaction/GrabbableObject";
import { TriggerObject } from "@/components/three/interaction/TriggerObject";
import { RepairObjectModel } from "@/components/three/gameplay/RepairObjectModel";
import { REPAIR_INTERACTION_RADIUS } from "@/data/gameplay/repairGameConfig";
import type { Vector3Tuple } from "@/types/three/three";

interface RepairEbikeRepairTriggerProps {
  anchor: Vector3Tuple;
  onRepair: () => void;
}

const REPLACEMENT_MODEL_PATH = "/models/refroidisseur/model.gltf";
const TRIGGER_OFFSET: Vector3Tuple = [0, 0.9, 0];

/**
 * Ebike-specific fake replacement flow: the broken radiator node is
 * hidden in the shared ExplodableModel, a grabbable copy appears at the
 * same anchor, then pressing E respawns a fresh part with a halo before
 * the reassembly step starts.
 */
export function RepairEbikeRepairTrigger({
  anchor,
  onRepair,
}: RepairEbikeRepairTriggerProps): React.JSX.Element {
  const [isInstalled, setIsInstalled] = useState(false);

  function handleRepair(): void {
    if (isInstalled) return;
    setIsInstalled(true);
    window.setTimeout(onRepair, 450);
  }

  return (
    <group>
      {!isInstalled ? (
        <GrabbableObject
          position={anchor}
          colliders="ball"
          handControlled
          label="Retirer le refroidisseur"
        >
          <RepairObjectModel
            label="Refroidisseur"
            modelPath={REPLACEMENT_MODEL_PATH}
            scale={0.24}
          />
        </GrabbableObject>
      ) : (
        <group position={anchor}>
          <RepairObjectModel
            label="Refroidisseur"
            modelPath={REPLACEMENT_MODEL_PATH}
            scale={0.24}
          />
          <mesh>
            <sphereGeometry args={[0.65, 32, 16]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.18} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.72, 0.025, 8, 96]} />
            <meshBasicMaterial color="#86efac" transparent opacity={0.85} />
          </mesh>
        </group>
      )}

      <TriggerObject
        position={[
          anchor[0] + TRIGGER_OFFSET[0],
          anchor[1] + TRIGGER_OFFSET[1],
          anchor[2] + TRIGGER_OFFSET[2],
        ]}
        colliders="ball"
        label="Changez le refroidisseur"
        radius={REPAIR_INTERACTION_RADIUS}
        onTrigger={handleRepair}
      >
        <mesh>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshBasicMaterial colorWrite={false} depthWrite={false} />
        </mesh>
      </TriggerObject>
    </group>
  );
}

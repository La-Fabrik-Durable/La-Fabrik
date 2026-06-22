import { GrabbableObject } from "@/components/three/interaction/GrabbableObject";
import { RepairObjectModel } from "@/components/three/gameplay/RepairObjectModel";
import type { Vector3Tuple } from "@/types/three/three";
import { assetUrl } from "@/utils/assetUrl";

interface RepairEbikeRepairTriggerProps {
  anchor: Vector3Tuple;
  installed: boolean;
}

const REPLACEMENT_MODEL_PATH = assetUrl("/models/refroidisseur/model.gltf");

/**
 * Ebike-specific fake replacement flow: the broken radiator node is
 * hidden in the shared ExplodableModel, a grabbable copy appears at the
 * same anchor, then RepairGame/RepairMissionCase controls the install
 * interaction and this component swaps the copy for a fresh glowing part.
 */
export function RepairEbikeRepairTrigger({
  anchor,
  installed,
}: RepairEbikeRepairTriggerProps): React.JSX.Element {
  return (
    <group>
      {!installed ? (
        <GrabbableObject
          position={anchor}
          colliders="ball"
          handControlled
          lockUntilGrab
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
    </group>
  );
}

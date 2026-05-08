import { RepairObjectModel } from "@/components/three/gameplay/RepairObjectModel";
import { RepairPromptVideo } from "@/components/three/gameplay/RepairPromptVideo";
import { TriggerObject } from "@/components/three/interaction/TriggerObject";
import type { RepairMissionConfig } from "@/data/gameplay/repairMissions";

interface RepairRepairingStepProps {
  config: RepairMissionConfig;
  onRepair: () => void;
}

export function RepairRepairingStep({
  config,
  onRepair,
}: RepairRepairingStepProps): React.JSX.Element {
  const replacementPart = config.replacementParts[0];
  const replacementModelPath = replacementPart?.modelPath ?? config.modelPath;
  const replacementLabel = replacementPart?.label ?? config.label;

  return (
    <group>
      <TriggerObject
        position={[0, 0.8, 0]}
        colliders="ball"
        label={`Installer ${replacementLabel}`}
        onTrigger={onRepair}
      >
        <mesh>
          <torusGeometry args={[0.95, 0.045, 12, 96]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.15, 0.9, 96]} />
          <meshBasicMaterial color="#86efac" transparent opacity={0.35} />
        </mesh>
      </TriggerObject>

      <group
        position={[
          config.case.position[0],
          config.case.position[1] + 1.2,
          config.case.position[2],
        ]}
      >
        <RepairObjectModel
          label={replacementLabel}
          modelPath={replacementModelPath}
          scale={0.35}
        />
      </group>

      <RepairPromptVideo src={config.interactUiPath} position={[0, 2.3, 0]} />
    </group>
  );
}

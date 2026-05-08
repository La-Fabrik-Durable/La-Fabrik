import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { RepairObjectModel } from "@/components/three/gameplay/RepairObjectModel";
import { RepairPromptVideo } from "@/components/three/gameplay/RepairPromptVideo";
import type { RepairMissionConfig } from "@/data/gameplay/repairMissions";
import type { Vector3Tuple } from "@/types/three/three";

interface RepairInspectionObjectProps {
  config: RepairMissionConfig;
  worldPosition: Vector3Tuple;
  onInspect: () => void;
}

export function RepairInspectionObject({
  config,
  worldPosition,
  onInspect,
}: RepairInspectionObjectProps): React.JSX.Element {
  return (
    <InteractableObject
      kind="trigger"
      label={`Inspecter ${config.label}`}
      position={worldPosition}
      onPress={onInspect}
    >
      <RepairObjectModel
        label={config.label}
        modelPath={config.modelPath}
        scale={0.9}
      />
      <RepairPromptVideo src={config.interactUiPath} />
    </InteractableObject>
  );
}

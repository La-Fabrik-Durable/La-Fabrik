import { RepairCaseModel } from "@/components/three/gameplay/RepairCaseModel";
import { REPAIR_CASE_MODEL_PATH } from "@/data/gameplay/repairCaseConfig";
import type { RepairMissionConfig } from "@/data/gameplay/repairMissions";

interface RepairMissionCaseProps {
  config: RepairMissionConfig;
}

export function RepairMissionCase({
  config,
}: RepairMissionCaseProps): React.JSX.Element {
  return (
    <RepairCaseModel
      modelPath={REPAIR_CASE_MODEL_PATH}
      open={false}
      position={config.case.position}
      rotation={config.case.rotation}
      scale={config.case.scale}
    />
  );
}

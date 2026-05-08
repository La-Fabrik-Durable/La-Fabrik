import { RepairInspectionObject } from "@/components/three/gameplay/RepairInspectionObject";
import { RepairMissionCase } from "@/components/three/gameplay/RepairMissionCase";
import { REPAIR_MISSIONS } from "@/data/gameplay/repairMissions";
import { useRepairMissionStep } from "@/hooks/gameplay/useRepairMissionStep";
import type { RepairMissionId } from "@/managers/stores/useGameStore";
import { useGameStore } from "@/managers/stores/useGameStore";
import type { ModelTransformProps, Vector3Tuple } from "@/types/three/three";
import { toVector3Scale } from "@/utils/three/scale";

interface RepairGameProps extends Required<
  Pick<ModelTransformProps, "position">
> {
  mission: RepairMissionId;
  rotation?: Vector3Tuple;
  scale?: ModelTransformProps["scale"];
}

export function RepairGame({
  mission,
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: RepairGameProps): React.JSX.Element | null {
  const config = REPAIR_MISSIONS[mission];
  const mainState = useGameStore((state) => state.mainState);
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const step = useRepairMissionStep(mission);
  const parsedScale = toVector3Scale(scale);

  if (mainState !== mission) return null;
  if (step === "locked") return null;

  return (
    <group position={position} rotation={rotation} scale={parsedScale}>
      {step === "waiting" ? (
        <RepairInspectionObject
          config={config}
          worldPosition={position}
          onInspect={() => setMissionStep(mission, "inspected")}
        />
      ) : null}
      {step !== "waiting" ? <RepairMissionCase config={config} /> : null}
    </group>
  );
}

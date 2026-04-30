import { TriggerObject } from "@/components/three/TriggerObject";
import { RepairCaseModel } from "@/components/three/RepairCaseModel";
import { AudioManager } from "@/managers/AudioManager";
import type { Vector3Tuple } from "@/types/three";

interface MainFeatureObjectProps {
  position: Vector3Tuple;
  open: boolean;
  onToggle: () => void;
}

const CASE_MODEL_PATH = "/models/packderelance/model.gltf";
const CASE_SOUND_PATH = "/sounds/effect/fa.mp3";
const CASE_OPEN_SOUND_RATE = 1.08;
const CASE_CLOSE_SOUND_RATE = 0.82;

export function MainFeatureObject({
  position,
  open,
  onToggle,
}: MainFeatureObjectProps): React.JSX.Element {
  return (
    <TriggerObject
      position={position}
      colliders="cuboid"
      label={open ? "Fermer la mallette" : "Ouvrir la mallette"}
      onTrigger={() => {
        AudioManager.getInstance().playSound(CASE_SOUND_PATH, 1, {
          playbackRate: open ? CASE_CLOSE_SOUND_RATE : CASE_OPEN_SOUND_RATE,
        });
        onToggle();
      }}
    >
      <RepairCaseModel
        modelPath={CASE_MODEL_PATH}
        open={open}
        position={[0, -0.45, 0]}
        scale={1.5}
      />
    </TriggerObject>
  );
}

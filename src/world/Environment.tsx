import {
  GAME_SCENE_SKY_MODEL_PATH,
  PHYSICS_SCENE_BACKGROUND_COLOR,
} from "@/data/world/environmentConfig";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { SkyModel } from "@/components/three/SkyModel";

export function Environment(): React.JSX.Element {
  const sceneMode = useSceneMode();

  if (sceneMode === "physics") {
    return (
      <color attach="background" args={[PHYSICS_SCENE_BACKGROUND_COLOR]} />
    );
  }

  return <SkyModel modelPath={GAME_SCENE_SKY_MODEL_PATH} />;
}

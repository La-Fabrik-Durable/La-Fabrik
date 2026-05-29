import {
  DEBUG_AXES_SIZE,
  DEBUG_GRID_DIVISIONS,
  DEBUG_GRID_PRIMARY_COLOR,
  DEBUG_GRID_SECONDARY_COLOR,
  DEBUG_GRID_SIZE,
  DEBUG_GRID_Y,
} from "@/data/debug/debugConfig";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { Debug } from "@/utils/debug/Debug";

export function DebugHelpers(): React.JSX.Element | null {
  const debug = Debug.getInstance();
  const sceneMode = useSceneMode();

  if (!debug.active || sceneMode === "game") {
    return null;
  }

  return (
    <>
      <gridHelper
        args={[
          DEBUG_GRID_SIZE,
          DEBUG_GRID_DIVISIONS,
          DEBUG_GRID_PRIMARY_COLOR,
          DEBUG_GRID_SECONDARY_COLOR,
        ]}
        position={[0, DEBUG_GRID_Y, 0]}
      />
      <axesHelper args={[DEBUG_AXES_SIZE]} />
    </>
  );
}

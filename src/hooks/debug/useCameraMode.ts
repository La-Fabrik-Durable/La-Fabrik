import { useSyncExternalStore } from "react";
import type { CameraMode } from "@/types/debug";
import { Debug } from "@/utils/debug/Debug";

export function useCameraMode(): CameraMode {
  const debug = Debug.getInstance();

  return useSyncExternalStore(
    (listener) => debug.subscribe(listener),
    () => debug.getCameraMode(),
    () => debug.getCameraMode(),
  );
}

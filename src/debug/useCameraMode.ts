import { useSyncExternalStore } from "react";
import type { CameraMode } from "@/debug/Debug";
import { Debug } from "@/debug/Debug";

export function useCameraMode(): CameraMode {
  const debug = Debug.getInstance();

  return useSyncExternalStore(
    (listener) => debug.subscribe(listener),
    () => debug.getCameraMode(),
    () => debug.getCameraMode(),
  );
}

import { Suspense } from "react";
import { DebugCameraControls } from "@/debug/scene/DebugCameraControls";
import { DebugHelpers } from "@/debug/scene/DebugHelpers";
import { useCameraMode } from "@/debug/useCameraMode";
import { Environment } from "@/world/Environment";
import { Lighting } from "@/world/Lighting";
import { Map } from "@/world/Map";
import { FPSController } from "@/world/player/FPSController";

export function World(): React.JSX.Element {
  const cameraMode = useCameraMode();

  return (
    <>
      <Environment />
      <Lighting />
      <DebugHelpers />
      {cameraMode === "debug" ? <DebugCameraControls /> : <FPSController />}
      <Suspense fallback={null}>
        <Map />
      </Suspense>
    </>
  );
}

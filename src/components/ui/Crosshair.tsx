import { useCameraMode } from "@/debug/useCameraMode";

export function Crosshair(): React.JSX.Element | null {
  const cameraMode = useCameraMode();

  if (cameraMode !== "player") {
    return null;
  }

  return <div className="crosshair" aria-hidden="true" />;
}

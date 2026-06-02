import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import { useSettingsStore } from "@/managers/stores/useSettingsStore";
import { setGlobalCamera } from "@/world/GameCinematics";

export function PlayerCamera(): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const isSettingsMenuOpen = useSettingsStore(
    (state) => state.isSettingsMenuOpen,
  );

  useEffect(() => {
    setGlobalCamera(camera);
    return () => {
      setGlobalCamera(null);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
  }, [camera]);

  return (
    <PointerLockControls
      enabled={!isSettingsMenuOpen}
      selector="#game-canvas"
    />
  );
}

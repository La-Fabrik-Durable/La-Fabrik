import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  GAME_SCENE_FALLBACK_BACKGROUND_COLOR,
  GAME_SCENE_FALLBACK_SKY_MODEL_PATH,
  GAME_SCENE_FALLBACK_SKY_MODEL_SCALE,
  GAME_SCENE_SKY_MODEL_PATH,
  GAME_SCENE_SKY_MODEL_SCALE,
  PHYSICS_SCENE_BACKGROUND_COLOR,
} from "@/data/world/environmentConfig";
import { FOG_CONFIG, FOG_LIGHTING_COLOR_MIX } from "@/data/world/fogConfig";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { useFogSettings } from "@/hooks/world/useFogSettings";
import {
  isMapModelVisible,
  useMapPerformanceStore,
} from "@/managers/stores/useMapPerformanceStore";
import { SkyModel } from "@/components/three/world/SkyModel";
import { useDebugStore } from "@/hooks/debug/useDebugStore";
import { LIGHTING_STATE } from "@/world/lightingState";

const tempSunFogColor = new THREE.Color();

function getLightingFogColor(target: THREE.Color): THREE.Color {
  target.set(LIGHTING_STATE.ambientColor);
  target.multiplyScalar(FOG_LIGHTING_COLOR_MIX.ambient);
  tempSunFogColor.set(LIGHTING_STATE.sunColor);
  target.add(tempSunFogColor.multiplyScalar(FOG_LIGHTING_COLOR_MIX.sun));

  return target;
}

export function Environment(): React.JSX.Element {
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const fog = useFogSettings();
  const fogEnabled = useDebugStore((debug) => debug.getFogEnabled());
  const groups = useMapPerformanceStore((state) => state.groups);
  const models = useMapPerformanceStore((state) => state.models);
  const scene = useThree((state) => state.scene);
  const fogColor = useMemo(() => getLightingFogColor(new THREE.Color()), []);
  const showSky = isMapModelVisible("sky", { groups, models });

  useFrame(() => {
    if (!scene.fog) return;

    getLightingFogColor(scene.fog.color);
  });

  if (sceneMode === "physics") {
    return (
      <color attach="background" args={[PHYSICS_SCENE_BACKGROUND_COLOR]} />
    );
  }

  return (
    <>
      {FOG_CONFIG.enabled &&
      fogEnabled &&
      sceneMode === "game" &&
      cameraMode === "player" &&
      fog.mode === "linear" ? (
        <fog attach="fog" args={[fogColor, fog.near, fog.far]} />
      ) : null}
      {FOG_CONFIG.enabled &&
      fogEnabled &&
      sceneMode === "game" &&
      cameraMode === "player" &&
      fog.mode === "exp2" ? (
        <fogExp2 attach="fog" args={[fogColor, fog.density]} />
      ) : null}
      {showSky ? (
        <SkyModel
          fallbackColor={GAME_SCENE_FALLBACK_BACKGROUND_COLOR}
          fallbackModelPath={GAME_SCENE_FALLBACK_SKY_MODEL_PATH}
          fallbackScale={GAME_SCENE_FALLBACK_SKY_MODEL_SCALE}
          modelPath={GAME_SCENE_SKY_MODEL_PATH}
          scale={GAME_SCENE_SKY_MODEL_SCALE}
        />
      ) : (
        <color
          attach="background"
          args={[GAME_SCENE_FALLBACK_BACKGROUND_COLOR]}
        />
      )}
    </>
  );
}

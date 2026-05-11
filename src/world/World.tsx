import { useState } from "react";
import type { Octree } from "three/addons/math/Octree.js";
import {
  PLAYER_SPAWN_POSITION_GAME,
  PLAYER_SPAWN_POSITION_PHYSICS,
} from "@/data/playerConfig";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import {
  ZoneDebugVisuals,
  ZoneDetection,
} from "@/components/zone/ZoneDetection";
import { GameFlow } from "@/components/game/GameFlow";
import { CentralObject } from "@/components/3d/CentralObject";
import { VillageoisHelperObject } from "@/components/3d/VillageoisHelperObject";
import { DebugCameraControls } from "@/utils/debug/scene/DebugCameraControls";
import { DebugHelpers } from "@/utils/debug/scene/DebugHelpers";
import { Environment } from "@/world/Environment";
import { Lighting } from "@/world/Lighting";
import { Map } from "@/world/Map";
import { PlayerComponent } from "@/world/player/PlayerComponent";
import { TestScene } from "@/world/debug/TestScene";

export function World(): React.JSX.Element {
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const [octree, setOctree] = useState<Octree | null>(null);
  const playerSpawnPosition =
    sceneMode === "game"
      ? PLAYER_SPAWN_POSITION_GAME
      : PLAYER_SPAWN_POSITION_PHYSICS;

  return (
    <>
      <Environment />
      <Lighting />
      <DebugHelpers />
      <ZoneDetection />
      <ZoneDebugVisuals />
      <GameFlow />
      <VillageoisHelperObject position={[1, 12, -55]} />
      <CentralObject position={[1, 15, -45]} />
      {cameraMode === "debug" ? <DebugCameraControls /> : null}

      {sceneMode === "game" ? (
        <Map onOctreeReady={setOctree} />
      ) : (
        <TestScene onOctreeReady={setOctree} />
      )}

      {cameraMode !== "debug" ? (
        <PlayerComponent octree={octree} spawnPosition={playerSpawnPosition} />
      ) : null}
    </>
  );
}

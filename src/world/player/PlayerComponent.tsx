import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { Octree } from "three/addons/math/Octree.js";
import { PLAYER_SPAWN_X, PLAYER_SPAWN_Z } from "@/data/playerConfig";
import { PlayerCamera } from "@/world/player/PlayerCamera";
import { PlayerController } from "@/world/player/PlayerController";

interface PlayerComponentProps {
  octree?: Octree | null;
  spawnY: number;
}

export function PlayerComponent({
  octree = null,
  spawnY,
}: PlayerComponentProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(PLAYER_SPAWN_X, spawnY, PLAYER_SPAWN_Z);
  }, [camera, spawnY]);

  return (
    <>
      <PlayerCamera />
      <PlayerController octree={octree} />
    </>
  );
}

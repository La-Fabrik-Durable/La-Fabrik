import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PlayerCamera, PLAYER_EYE_HEIGHT } from "@/world/player/PlayerCamera";
import { PlayerController } from "@/world/player/PlayerController";

const SPAWN_POSITION = { x: 0, y: PLAYER_EYE_HEIGHT, z: 0 };

export function PlayerComponent(): React.JSX.Element {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(SPAWN_POSITION.x, SPAWN_POSITION.y, SPAWN_POSITION.z);
  }, [camera]);

  return (
    <>
      <PlayerCamera />
      <PlayerController />
    </>
  );
}

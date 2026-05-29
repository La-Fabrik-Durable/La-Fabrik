import { WorldPlaneCollision } from "@/world/collision/WorldPlaneCollision";
import { WorldWallsCollision } from "@/world/collision/WorldWallsCollision";

export function WorldBoundsCollision(): React.JSX.Element {
  return (
    <group name="world-bounds-collision">
      <WorldPlaneCollision />
      <WorldWallsCollision />
    </group>
  );
}

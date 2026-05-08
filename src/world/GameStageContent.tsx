import { RepairGame } from "@/components/three/gameplay/RepairGame";
import { useGameStore } from "@/managers/stores/useGameStore";
import type { Vector3Tuple } from "@/types/three/three";

interface StageAnchorProps {
  color: string;
  position: Vector3Tuple;
  scale?: number;
}

function StageAnchor({
  color,
  position,
  scale = 1,
}: StageAnchorProps): React.JSX.Element {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.25}
        />
      </mesh>
    </group>
  );
}

export function GameStageContent(): React.JSX.Element {
  const mainState = useGameStore((state) => state.mainState);

  switch (mainState) {
    case "intro":
      return <StageAnchor color="#7dd3fc" position={[0, 4, 0]} />;
    case "bike":
      return <RepairGame mission="bike" position={[8, 0, -6]} />;
    case "pylone":
      return <RepairGame mission="pylone" position={[64, 0, -66]} />;
    case "ferme":
      return <RepairGame mission="ferme" position={[-24, 0, 42]} />;
    case "outro":
      return <StageAnchor color="#fb7185" position={[0, 6, 10]} scale={1.25} />;
  }
}

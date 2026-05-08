import { Html } from "@react-three/drei";
import type { Vector3Tuple } from "@/types/three/three";

interface RepairPromptVideoProps {
  src: string;
  position?: Vector3Tuple;
  size?: number;
}

export function RepairPromptVideo({
  src,
  position = [0, 1.8, 0],
  size = 96,
}: RepairPromptVideoProps): React.JSX.Element {
  return (
    <Html position={position} center transform occlude={false}>
      <video
        aria-hidden="true"
        autoPlay
        loop
        muted
        playsInline
        src={src}
        style={{
          display: "block",
          height: size,
          objectFit: "contain",
          pointerEvents: "none",
          width: size,
        }}
      />
    </Html>
  );
}

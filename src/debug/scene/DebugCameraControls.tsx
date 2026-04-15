import { OrbitControls } from "@react-three/drei";

export function DebugCameraControls(): React.JSX.Element {
  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.05}
      minDistance={100}
      maxDistance={1000}
      target={[0, 1.75, 0]}
    />
  );
}

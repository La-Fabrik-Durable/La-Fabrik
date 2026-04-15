import { Canvas } from "@react-three/fiber";
import { Crosshair } from "@/components/ui/Crosshair";
import { DebugPerf } from "@/debug/DebugPerf";
import { World } from "@/world/World";

function App(): React.JSX.Element {
  return (
    <>
      <Canvas camera={{ position: [85, 60, 85], fov: 42 }} shadows>
        <World />
        <DebugPerf />
      </Canvas>
      <Crosshair />
    </>
  );
}

export default App;

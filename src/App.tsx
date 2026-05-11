import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Crosshair } from "@/components/ui/Crosshair";
import { InteractPrompt } from "@/components/ui/InteractPrompt";
import { IntroUI, BienvenueDisplay } from "@/components/ui/IntroUI";
import { DialogMessage } from "@/components/ui/DialogMessage";
import { useGameStore } from "@/stores/gameStore";
import { DebugPerf } from "@/utils/debug/DebugPerf";
import { World } from "@/world/World";

function App(): React.JSX.Element {
  const dialogMessage = useGameStore((state) => state.dialogMessage);
  const hideDialog = useGameStore((state) => state.hideDialog);

  useEffect(() => {
    if (dialogMessage) {
      const timer = setTimeout(() => {
        hideDialog();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [dialogMessage, hideDialog]);

  return (
    <>
      <Canvas camera={{ position: [85, 60, 85], fov: 42 }} shadows>
        <Suspense fallback={null}>
          <World />
          <DebugPerf />
        </Suspense>
      </Canvas>
      <Crosshair />
      <InteractPrompt />
      <IntroUI />
      <BienvenueDisplay />
      {dialogMessage && (
        <DialogMessage
          message={dialogMessage}
          duration={3000}
          onClose={hideDialog}
        />
      )}
    </>
  );
}

export default App;

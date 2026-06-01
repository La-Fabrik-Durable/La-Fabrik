import { useGameStore } from "@/managers/stores/useGameStore";

export function PylonNarratorOutro(): React.JSX.Element | null {
  const mainState = useGameStore((state) => state.mainState);
  const step = useGameStore((state) => state.pylon.currentStep);

  if (mainState !== "pylon") return null;
  if (step !== "narrator-outro") return null;

  return null;
}

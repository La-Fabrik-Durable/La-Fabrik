import { Crosshair } from "@/components/ui/Crosshair";
import { DebugOverlayLayout } from "@/components/ui/debug/DebugOverlayLayout";
import { GameSettingsMenu } from "@/components/ui/GameSettingsMenu";
import { HandTrackingFallback } from "@/components/ui/HandTrackingFallback";
import { HandTrackingVisualizer } from "@/components/ui/HandTrackingVisualizer";
import { InteractPrompt } from "@/components/ui/InteractPrompt";
import { OutroVideoOverlay } from "@/components/ui/OutroVideoOverlay";
import { Subtitles } from "@/components/ui/Subtitles";
import { TalkieDialogueOverlay } from "@/components/ui/TalkieDialogueOverlay";

export function GameUI(): React.JSX.Element {
  return (
    <>
      <DebugOverlayLayout />
      <Crosshair />
      <InteractPrompt />
      <HandTrackingVisualizer />
      <HandTrackingFallback />
      <Subtitles />
      <TalkieDialogueOverlay />
      <GameSettingsMenu />
      <OutroVideoOverlay />
    </>
  );
}

import { useEffect, useRef } from "react";
import { AudioManager } from "@/managers/AudioManager";
import { useGameStore } from "@/managers/stores/useGameStore";

const INTRO_DIALOGUE_PATH = "/sounds/dialogue/narrateur_ordreebike.mp3";

/**
 * Black screen overlay with dialogue audio
 * - Plays narrateur_ordreebike.mp3
 * - Transitions to reveal step when dialogue ends
 */
export function IntroDialogueOverlay(): React.JSX.Element {
  const setIntroStep = useGameStore((state) => state.setIntroStep);
  const dialogueStarted = useRef(false);

  useEffect(() => {
    if (dialogueStarted.current) return;
    dialogueStarted.current = true;

    // Play dialogue then transition to reveal
    const audio = AudioManager.getInstance();
    audio.playSoundWithCallback(INTRO_DIALOGUE_PATH, 0.8, () => {
      setIntroStep("reveal");
    });
  }, [setIntroStep]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          color: "rgba(255, 255, 255, 0.5)",
          fontSize: 16,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        ...
      </span>
    </div>
  );
}

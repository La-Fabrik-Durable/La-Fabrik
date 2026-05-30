import { useEffect, useState } from "react";
import { useGameStore } from "@/managers/stores/useGameStore";

const REVEAL_DURATION_MS = 2000;

/**
 * Fade-out overlay for reveal transition
 * - Starts fully black
 * - Fades out to reveal the game world
 * - Transitions to playing step when done
 */
export function IntroRevealOverlay(): React.JSX.Element {
  const setIntroStep = useGameStore((state) => state.setIntroStep);
  const completeIntro = useGameStore((state) => state.completeIntro);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Start fade out
    const fadeTimeout = window.setTimeout(() => {
      setOpacity(0);
    }, 100);

    // Complete intro after fade
    const completeTimeout = window.setTimeout(() => {
      setIntroStep("playing");
      completeIntro();
    }, REVEAL_DURATION_MS);

    return () => {
      window.clearTimeout(fadeTimeout);
      window.clearTimeout(completeTimeout);
    };
  }, [setIntroStep, completeIntro]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        opacity,
        transition: `opacity ${REVEAL_DURATION_MS}ms ease-out`,
        zIndex: 998,
        pointerEvents: "none",
      }}
    />
  );
}

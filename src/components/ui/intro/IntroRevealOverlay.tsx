import { useEffect, useState } from "react";
import { useGameStore } from "@/managers/stores/useGameStore";
import { usePrefersReducedMotion } from "@/hooks/ui/usePrefersReducedMotion";

const REVEAL_DURATION_MS = 2000;

/**
 * Fade-out overlay revealing the game world.
 * Calls completeIntro() when the fade is done — completeIntro also flips
 * intro.currentStep to "playing" so no separate setIntroStep call is needed.
 */
export function IntroRevealOverlay(): React.JSX.Element {
  const completeIntro = useGameStore((state) => state.completeIntro);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const fadeTimeout = window.setTimeout(() => {
      setOpacity(0);
    }, 100);

    const completeTimeout = window.setTimeout(() => {
      completeIntro();
    }, REVEAL_DURATION_MS);

    return () => {
      window.clearTimeout(fadeTimeout);
      window.clearTimeout(completeTimeout);
    };
  }, [completeIntro]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        opacity,
        transition: prefersReducedMotion
          ? "none"
          : `opacity ${REVEAL_DURATION_MS}ms ease-out`,
        zIndex: 998,
        pointerEvents: "none",
      }}
    />
  );
}

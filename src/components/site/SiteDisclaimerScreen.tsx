import { useCallback, useEffect, useRef, useState } from "react";
import { useSiteStore } from "@/managers/stores/useSiteStore";

const DISCLAIMER_TEXT =
  "Ce site a été conçu pour être utilisé sur ordinateur.\nPour une meilleure expérience, assurez-vous d'avoir une bonne connexion internet et une machine performante.";

const TEXT_DISPLAY_DURATION = 5000;
const FADE_OUT_DURATION = 1000;
const TRANSITION_DELAY = 250;

/**
 * Screen 0: Disclaimer
 */
export function SiteDisclaimerScreen(): React.JSX.Element {
  const setStep = useSiteStore((state) => state.setStep);
  const [textOpacity, setTextOpacity] = useState(0);
  const hasSkipped = useRef(false);

  const handleSkip = useCallback(() => {
    if (hasSkipped.current) return;
    hasSkipped.current = true;
    setStep("welcome");
  }, [setStep]);

  useEffect(() => {
    // Fade in text
    const fadeInTimeout = window.setTimeout(() => {
      setTextOpacity(1);
    }, 100);

    // Start fade out after display duration
    const fadeOutTimeout = window.setTimeout(() => {
      setTextOpacity(0);
    }, TEXT_DISPLAY_DURATION);

    // Transition to welcome after fade out + delay
    const transitionTimeout = window.setTimeout(
      () => {
        handleSkip();
      },
      TEXT_DISPLAY_DURATION + FADE_OUT_DURATION + TRANSITION_DELAY,
    );

    return () => {
      window.clearTimeout(fadeInTimeout);
      window.clearTimeout(fadeOutTimeout);
      window.clearTimeout(transitionTimeout);
    };
  }, [handleSkip]);

  return (
    <div
      onClick={handleSkip}
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
        cursor: "pointer",
      }}
    >
      <p
        style={{
          color: "#F2F2F2",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 20,
          fontWeight: 400,
          lineHeight: 1.6,
          maxWidth: 800,
          opacity: textOpacity,
          transition: `opacity ${FADE_OUT_DURATION}ms ease-in-out`,
          whiteSpace: "pre-wrap",
        }}
      >
        {DISCLAIMER_TEXT}
      </p>
    </div>
  );
}

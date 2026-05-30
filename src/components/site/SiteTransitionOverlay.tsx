import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSiteStore } from "@/managers/stores/useSiteStore";
import { Subtitles } from "@/components/ui/Subtitles";
import { setSiteVisited } from "@/utils/cookies/siteVisitCookie";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";

const FADE_DURATION_MS = 1000;

/**
 * Transition overlay: black screen (fade in) + logo (fade in/out) + dialogue with subtitles + redirect to /
 */
export function SiteTransitionOverlay(): React.JSX.Element {
  const navigate = useNavigate();
  const reset = useSiteStore((state) => state.reset);
  const [screenOpacity, setScreenOpacity] = useState(0);
  const [logoOpacity, setLogoOpacity] = useState(0);
  const transitionStarted = useRef(false);

  useEffect(() => {
    if (transitionStarted.current) return;
    transitionStarted.current = true;

    // Fade in black screen
    setScreenOpacity(1);

    // Set cookie
    setSiteVisited();

    // Fade in logo after the black screen transition delay.
    setLogoOpacity(1);

    // Play transition dialogue (with subtitles) then fade out logo and redirect
    void (async () => {
      const manifest = await loadDialogueManifest();
      if (manifest) {
        const dialogueAudio = await playDialogueById(
          manifest,
          "narrateur_intro_apresprenom",
        );
        if (dialogueAudio) {
          dialogueAudio.addEventListener(
            "ended",
            () => {
              // Fade out logo
              setLogoOpacity(0);
              // Redirect after logo fade out
              setTimeout(() => {
                reset();
                navigate({ to: "/" });
              }, FADE_DURATION_MS);
            },
            { once: true },
          );
          return;
        }
      }
      // Fallback: redirect after 3s if dialogue fails
      setTimeout(() => {
        setLogoOpacity(0);
        setTimeout(() => {
          reset();
          navigate({ to: "/" });
        }, FADE_DURATION_MS);
      }, 3000);
    })();
  }, [navigate, reset]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#000",
          zIndex: 0,
          opacity: screenOpacity,
          transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`,
        }}
      />
      <img
        src="/assets/logo/logo.jpg"
        alt="Logo"
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(300px, 45vw)",
          height: "auto",
          objectFit: "contain",
          opacity: logoOpacity,
          transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`,
          transitionDelay: logoOpacity === 1 ? `${FADE_DURATION_MS}ms` : "0ms",
        }}
      />
      <Subtitles />
    </div>
  );
}

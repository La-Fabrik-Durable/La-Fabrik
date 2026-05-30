import { useCallback, useRef, useEffect } from "react";
import { useGameStore } from "@/managers/stores/useGameStore";

const INTRO_VIDEO_PATH = "/cinematics/intro.mp4";

/**
 * Full-screen video player for intro cinematic
 * - Plays intro.mp4 in fullscreen
 * - Automatically advances to dialogue-intro step when video ends
 * - Allows skipping with Enter/Space/Click
 */
export function IntroVideoPlayer(): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const setIntroStep = useGameStore((state) => state.setIntroStep);

  const handleVideoEnd = useCallback(() => {
    setIntroStep("dialogue-intro");
  }, [setIntroStep]);

  const handleSkip = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIntroStep("dialogue-intro");
  }, [setIntroStep]);

  // Handle keyboard skip (Enter/Space)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSkip]);

  return (
    <div
      onClick={handleSkip}
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 1000,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <video
        ref={videoRef}
        src={INTRO_VIDEO_PATH}
        autoPlay
        playsInline
        onEnded={handleVideoEnd}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <span
        style={{
          position: "absolute",
          bottom: 32,
          right: 32,
          color: "rgba(255, 255, 255, 0.6)",
          fontSize: 14,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Appuyez pour passer
      </span>
    </div>
  );
}

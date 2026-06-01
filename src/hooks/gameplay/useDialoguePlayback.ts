import { useEffect } from "react";
import { useGameStore } from "@/managers/stores/useGameStore";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";

interface UseDialoguePlaybackOptions {
  enabled: boolean;
  dialogueId: string | null;
  onComplete?: () => void;
}

export function useDialoguePlayback({
  enabled,
  dialogueId,
  onComplete,
}: UseDialoguePlaybackOptions): void {
  const setCanMove = useGameStore((state) => state.setCanMove);

  useEffect(() => {
    if (!enabled || !dialogueId) return undefined;

    let isCancelled = false;
    setCanMove(false);

    void (async () => {
      const manifest = await loadDialogueManifest();
      if (isCancelled || !manifest) {
        setCanMove(true);
        return;
      }

      const audio = await playDialogueById(manifest, dialogueId);
      if (isCancelled || !audio) {
        setCanMove(true);
        return;
      }

      audio.addEventListener(
        "ended",
        () => {
          setCanMove(true);
          onComplete?.();
        },
        { once: true },
      );
    })();

    return () => {
      isCancelled = true;
      setCanMove(true);
    };
  }, [enabled, dialogueId, onComplete, setCanMove]);
}

import { useEffect, useRef } from "react";
import {
  EBIKE_DIAGNOSTIC_DIALOGUE_ID,
  EBIKE_REPAIRED_DIALOGUE_ID,
  EBIKE_SCAN_HINT_DIALOGUE_ID,
} from "@/data/ebike/ebikeConfig";
import { useGameStore } from "@/managers/stores/useGameStore";
import type { MissionStep } from "@/types/gameplay/repairMission";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";

/**
 * Plays narrator cues during the ebike repair game:
 * - `fragmented`  -> "Alors? Pas magnifique ça?... ces galets vont scanner..."
 * - `repairing`   -> "Parfait! C'est le refroidisseur qui a lâché..."
 * - `done`        -> "Eeeet voilà! Il fonctionne comme une horloge!..."
 *
 * Each cue is one-shot per mission run; the played-set resets when the
 * mission state rolls back to `locked`/`waiting` so debug-panel replays
 * still trigger the narration.
 */
const STEP_TO_DIALOGUE_ID: Partial<Record<MissionStep, string>> = {
  fragmented: EBIKE_SCAN_HINT_DIALOGUE_ID,
  repairing: EBIKE_DIAGNOSTIC_DIALOGUE_ID,
  done: EBIKE_REPAIRED_DIALOGUE_ID,
};

export function EbikeRepairNarrator(): null {
  const mainState = useGameStore((state) => state.mainState);
  const ebikeStep = useGameStore((state) => state.ebike.currentStep);
  const playedRef = useRef<Set<MissionStep>>(new Set());

  useEffect(() => {
    if (ebikeStep === "locked" || ebikeStep === "waiting") {
      playedRef.current.clear();
    }
  }, [ebikeStep]);

  useEffect(() => {
    if (mainState !== "ebike") return;

    const dialogueId = STEP_TO_DIALOGUE_ID[ebikeStep];
    if (!dialogueId) return;
    if (playedRef.current.has(ebikeStep)) return;

    playedRef.current.add(ebikeStep);

    let cancelled = false;
    let activeAudio: HTMLAudioElement | null = null;

    void (async () => {
      const manifest = await loadDialogueManifest();
      if (cancelled || !manifest) return;
      const audio = await playDialogueById(manifest, dialogueId);
      if (cancelled) {
        if (audio && !audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
        return;
      }
      activeAudio = audio;
    })();

    return () => {
      cancelled = true;
      if (activeAudio && !activeAudio.paused) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      }
    };
  }, [mainState, ebikeStep]);

  return null;
}

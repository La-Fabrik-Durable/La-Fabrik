import { useEffect, useRef, useState } from "react";
import { GameStepManager } from "@/stateManager/GameStepManager";
import { AudioManager } from "@/stateManager/AudioManager";
import { AUDIO_PATHS } from "@/data/audioConfig";

export function GameFlow(): null {
  const manager = GameStepManager.getInstance();
  const hasInitialized = useRef(false);
  const [step, setStep] = useState(manager.getStep());

  useEffect(() => {
    const unsubscribe = manager.subscribe(() => {
      setStep(manager.getStep());
    });
    return unsubscribe;
  }, [manager]);

  useEffect(() => {
    console.log("[GameFlow] Current step:", step);
    if (!hasInitialized.current && step === "intro") {
      hasInitialized.current = true;
      console.log("[GameFlow] Transition to start-intro");
      manager.transitionTo("start-intro");
    }
  }, [step, manager]);

  useEffect(() => {
    console.log("[GameFlow] useEffect triggered, step:", step);

    if (step === "start-intro") {
      console.log("[GameFlow] Playing intro audio");
      const audio = AudioManager.getInstance();
      audio.playSoundWithCallback(AUDIO_PATHS.intro, 0.5, () => {
        console.log("[GameFlow] Intro audio ended, transition to naming");
        manager.transitionTo("naming");
      });

      return () => {};
    }

    if (step === "bienvenue") {
      console.log("[GameFlow] Playing bienvenue audio");
      const audio = AudioManager.getInstance();
      audio.playSoundWithCallback(AUDIO_PATHS.bienvenue, 0.5, () => {
        console.log("[GameFlow] Bienvenue audio ended, enable movement");
        manager.setCanMove(true);
        manager.transitionTo("star-move");
      });

      return () => {};
    }

    return undefined;
  }, [step, manager]);

  return null;
}

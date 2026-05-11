import { useSyncExternalStore } from "react";
import { GameStepManager } from "@/stateManager/GameStepManager";
import type { GameStepSnapshot } from "@/types/game";

const manager = GameStepManager.getInstance();

export function useGameStep(): GameStepSnapshot {
  return useSyncExternalStore(manager.subscribe.bind(manager), () => ({
    step: manager.getStep(),
    transitionTo: manager.transitionTo.bind(manager),
  }));
}

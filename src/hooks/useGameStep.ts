import { useSyncExternalStore } from "react";
import { GameStepManager } from "@/managers/GameStepManager";
import type { GameStepSnapshot } from "@/types/game";

const manager = GameStepManager.getInstance();

export function useGameStep(): GameStepSnapshot {
  return useSyncExternalStore(manager.subscribe.bind(manager), () =>
    manager.getSnapshot(),
  );
}

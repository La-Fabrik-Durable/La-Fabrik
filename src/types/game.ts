import type { Vector3Tuple } from "@/types/3d";

export type GameStep = "intro" | "outOfFabrik";

export interface Zone {
  id: string;
  position: Vector3Tuple;
  radius: number;
  height: number;
  targetStep: GameStep;
}

export interface GameState {
  step: GameStep;
}

export interface GameStepSnapshot {
  step: GameStep;
  transitionTo: (step: GameStep) => void;
}

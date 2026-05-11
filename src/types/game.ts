import type { Vector3Tuple } from "@/types/three/three";

export type GameStep =
  | "intro"
  | "start-intro"
  | "naming"
  | "bienvenue"
  | "star-move"
  | "mission2"
  | "searching"
  | "helped"
  | "manipulation"
  | "outOfFabrik";

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
  playerName: string;
  canMove: boolean;
  transitionTo: (step: GameStep) => void;
  setPlayerName: (name: string) => void;
}

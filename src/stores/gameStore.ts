import { create } from "zustand";
import type { GameStep } from "@/types/game";

interface GameState {
  step: GameStep;
  activityCity: boolean;
  playerName: string;
  canMove: boolean;
  dialogMessage: string | null;
  setStep: (step: GameStep) => void;
  setActivityCity: (value: boolean) => void;
  setPlayerName: (name: string) => void;
  setCanMove: (canMove: boolean) => void;
  showDialog: (message: string) => void;
  hideDialog: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  step: "intro",
  activityCity: true,
  playerName: "",
  canMove: false,
  dialogMessage: null,
  setStep: (step) => set({ step }),
  setActivityCity: (value) => set({ activityCity: value }),
  setPlayerName: (name) => set({ playerName: name }),
  setCanMove: (canMove) => set({ canMove }),
  showDialog: (message) => set({ dialogMessage: message }),
  hideDialog: () => set({ dialogMessage: null }),
}));

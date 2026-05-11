import { create } from "zustand";
import type { GameStep } from "@/types/game";

interface MissionFlowState {
  activityCity: boolean;
  canMove: boolean;
  dialogMessage: string | null;
  playerName: string;
  step: GameStep;
}

interface MissionFlowActions {
  hideDialog: () => void;
  setActivityCity: (value: boolean) => void;
  setCanMove: (canMove: boolean) => void;
  setPlayerName: (name: string) => void;
  setStep: (step: GameStep) => void;
  showDialog: (message: string) => void;
}

export const useMissionFlowStore = create<
  MissionFlowState & MissionFlowActions
>((set) => ({
  activityCity: true,
  canMove: false,
  dialogMessage: null,
  playerName: "",
  step: "intro",
  hideDialog: () => set({ dialogMessage: null }),
  setActivityCity: (activityCity) => set({ activityCity }),
  setCanMove: (canMove) => set({ canMove }),
  setPlayerName: (playerName) => set({ playerName }),
  setStep: (step) => set({ step }),
  showDialog: (dialogMessage) => set({ dialogMessage }),
}));

import { create } from "zustand";

export type MainGameState = "intro" | "bike" | "pylone" | "ferme" | "outro";
export type MissionStep = "locked" | "inspect" | "repair" | "done";

export interface IntroState {
  dialogueAudio: string | null;
  hasCompleted: boolean;
  isBikeUnlocked: boolean;
}

export interface MissionState {
  currentStep: MissionStep;
  dialogueAudio: string | null;
}

export interface GameState {
  mainState: MainGameState;
  intro: IntroState;
  bike: MissionState & {
    isRepaired: boolean;
  };
  pylone: MissionState & {
    isPowered: boolean;
  };
  ferme: MissionState & {
    irrigationFixed: boolean;
  };
  outro: {
    dialogueAudio: string | null;
    hasStarted: boolean;
  };
}

interface GameActions {
  setMainState: (mainState: MainGameState) => void;
  setIntroState: (intro: Partial<IntroState>) => void;
  setBikeState: (bike: Partial<GameState["bike"]>) => void;
  setPyloneState: (pylone: Partial<GameState["pylone"]>) => void;
  setFermeState: (ferme: Partial<GameState["ferme"]>) => void;
  setOutroState: (outro: Partial<GameState["outro"]>) => void;
  resetGame: () => void;
}

export type GameStore = GameState & GameActions;

function createInitialGameState(): GameState {
  return {
    mainState: "intro",
    intro: {
      dialogueAudio: ""null,
      hasCompleted: false,
      isBikeUnlocked: false,
    },
    bike: {
      currentStep: "locked",
      dialogueAudio: null,
      isRepaired: false,
    },
    pylone: {
      currentStep: "locked",
      dialogueAudio: null,
      isPowered: false,
    },
    ferme: {
      currentStep: "locked",
      dialogueAudio: null,
      irrigationFixed: false,
    },
    outro: {
      dialogueAudio: null,
      hasStarted: false,
    },
  };
}

export const useGameStore = create<GameStore>()((set) => ({
  ...createInitialGameState(),
  setMainState: (mainState) => set({ mainState }),
  setIntroState: (intro) =>
    set((state) => ({ intro: { ...state.intro, ...intro } })),
  setBikeState: (bike) =>
    set((state) => ({ bike: { ...state.bike, ...bike } })),
  setPyloneState: (pylone) =>
    set((state) => ({ pylone: { ...state.pylone, ...pylone } })),
  setFermeState: (ferme) =>
    set((state) => ({ ferme: { ...state.ferme, ...ferme } })),
  setOutroState: (outro) =>
    set((state) => ({ outro: { ...state.outro, ...outro } })),
  resetGame: () => set(createInitialGameState()),
}));

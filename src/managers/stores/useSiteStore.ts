import { create } from "zustand";
import type { SiteStep } from "@/types/game";

interface SiteState {
  currentStep: SiteStep;
  selectedExperience: number | null;
  selectedSituation: number | null;
}

interface SiteActions {
  setStep: (step: SiteStep) => void;
  setSelectedExperience: (index: number) => void;
  setSelectedSituation: (index: number) => void;
  reset: () => void;
}

type SiteStore = SiteState & SiteActions;

const initialState: SiteState = {
  currentStep: "disclaimer",
  selectedExperience: null,
  selectedSituation: null,
};

export const useSiteStore = create<SiteStore>()((set) => ({
  ...initialState,
  setStep: (step) => set({ currentStep: step }),
  setSelectedExperience: (index) => set({ selectedExperience: index }),
  setSelectedSituation: (index) => set({ selectedSituation: index }),
  reset: () => set(initialState),
}));

import { create } from "zustand";

export type HandTrackingGloveHandedness = "left" | "right";

type HandTrackingGloveLoadState = "idle" | "loaded" | "error";

interface HandTrackingGloveStatusState {
  gloves: Record<HandTrackingGloveHandedness, HandTrackingGloveLoadState>;
  setGloveStatus: (
    handedness: HandTrackingGloveHandedness,
    status: HandTrackingGloveLoadState,
  ) => void;
}

export const useHandTrackingGloveStatus =
  create<HandTrackingGloveStatusState>()((set) => ({
    gloves: {
      left: "idle",
      right: "idle",
    },
    setGloveStatus: (handedness, status) =>
      set((state) => ({
        gloves: {
          ...state.gloves,
          [handedness]: status,
        },
      })),
  }));

import { create } from "zustand";
import type { RepairMissionId } from "@/types/gameplay/repairMission";
import type { Vector3Tuple } from "@/types/three/three";

interface RepairMissionAnchorStore {
  anchors: Partial<Record<RepairMissionId, Vector3Tuple>>;
  setAnchors: (anchors: Partial<Record<RepairMissionId, Vector3Tuple>>) => void;
}

export const useRepairMissionAnchorStore = create<RepairMissionAnchorStore>(
  (set) => ({
    anchors: {},
    setAnchors: (anchors) => set({ anchors }),
  }),
);

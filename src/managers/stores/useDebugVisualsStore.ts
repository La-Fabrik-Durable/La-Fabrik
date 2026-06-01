import { create } from "zustand";

interface DebugVisualsStore {
  showPlayerModel: boolean;
  setShowPlayerModel: (value: boolean) => void;
  showOctree: boolean;
  setShowOctree: (value: boolean) => void;
  octreeMaxDepth: number;
  setOctreeMaxDepth: (value: number) => void;
}

export const useDebugVisualsStore = create<DebugVisualsStore>((set) => ({
  showPlayerModel: false,
  setShowPlayerModel: (showPlayerModel) => set({ showPlayerModel }),
  showOctree: false,
  setShowOctree: (showOctree) => set({ showOctree }),
  octreeMaxDepth: 6,
  setOctreeMaxDepth: (octreeMaxDepth) => set({ octreeMaxDepth }),
}));

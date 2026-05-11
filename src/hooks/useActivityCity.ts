import { useGameStore } from "@/managers/stores/useGameStore";

export function useActivityCity(): boolean {
  return useGameStore((state) => state.missionFlow.activityCity);
}

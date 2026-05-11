import { useGameStore } from "@/stores/gameStore";

export function useActivityCity(): boolean {
  return useGameStore((state) => state.activityCity);
}

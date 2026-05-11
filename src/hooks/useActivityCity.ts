import { useMissionFlowStore } from "@/managers/stores/useMissionFlowStore";

export function useActivityCity(): boolean {
  return useMissionFlowStore((state) => state.activityCity);
}

import type {
  MissionStep,
  RepairMissionId,
} from "@/managers/stores/useGameStore";
import { useGameStore } from "@/managers/stores/useGameStore";

export function useRepairMissionStep(mission: RepairMissionId): MissionStep {
  return useGameStore((state) => state[mission].currentStep);
}
